#!/usr/bin/env bash

set -uo pipefail

BASE="${BASE:-http://localhost:8000/api}"
PASS=0
FAIL=0

c()  { printf '\033[%sm%s\033[0m' "$1" "$2"; }
head_() { printf '\n%s\n%s\n' "$(c '1;36' "── $* ")" "$(printf '%.0s─' {1..70})"; }

check() {
  local desc="$1" expect="$2"; shift 2
  local body status
  body=$(curl -s -w '\n%{http_code}' "$@")
  status=$(tail -n1 <<<"$body")
  BODY=$(sed '$d' <<<"$body")
  if [[ "$status" == "$expect" ]]; then
    printf '  %s %-58s %s\n' "$(c '0;32' 'PASS')" "$desc" "$status"; PASS=$((PASS+1))
  else
    printf '  %s %-58s got %s want %s\n' "$(c '0;31' 'FAIL')" "$desc" "$status" "$expect"
    printf '       %s\n' "$(head -c 300 <<<"$BODY")"; FAIL=$((FAIL+1))
  fi
}

PY_BIN="${PY_BIN:-./.venv/Scripts/python.exe}"
[[ -x "$PY_BIN" ]] || PY_BIN="python"
J() { "$PY_BIN" scripts/jsonq.py "$1" <<<"$BODY"; }

head_ "System"
check "GET /health" 200 "$BASE/health"
check "GET /tags (public)" 200 "$BASE/tags"
echo "       styles=$(J 'len(d["styles"])') content=$(J 'len(d["content_tags"])') types=$(J 'len(d["commission_types"])')"

head_ "Auth: registration validation"
NEWUSER="smoke_$(date +%s)"
check "register: short password -> 422" 422 -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$NEWUSER@example.com\",\"username\":\"$NEWUSER\",\"password\":\"short\",\"display_name\":\"Smoke\"}"
echo "       errors: $(J 'd["errors"][0]["field"]') / $(J 'd["code"]')"

check "register: bad username chars -> 422" 422 -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$NEWUSER@example.com\",\"username\":\"bad handle!\",\"password\":\"password123\",\"display_name\":\"Smoke\"}"

check "register: bad email -> 422" 422 -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"not-an-email\",\"username\":\"$NEWUSER\",\"password\":\"password123\",\"display_name\":\"Smoke\"}"

check "register: duplicate email -> 409" 409 -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"mira_oku@example.com","username":"someoneelse","password":"password123","display_name":"Dupe"}'
echo "       code: $(J 'd["code"]')"

check "register: duplicate username -> 409" 409 -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d '{"email":"brand-new@example.com","username":"mira_oku","password":"password123","display_name":"Dupe"}'
echo "       code: $(J 'd["code"]')"

head_ "Auth: register, login, me"
check "register new artist -> 201" 201 -X POST "$BASE/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$NEWUSER@example.com\",\"username\":\"$NEWUSER\",\"password\":\"password123\",\"display_name\":\"Smoke Artist\",\"is_artist\":true}"
ARTIST_TOKEN=$(J 'd["access_token"]')
echo "       new artist id: $(J 'd["user"]["id"]')"

check "login: wrong password -> 401" 401 -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"kestrel_dev@example.com","password":"wrong-password"}'
echo "       code: $(J 'd["code"]')"

check "login: unknown email -> 401 (no enumeration)" 401 -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"nobody@example.com","password":"password123"}'

check "login seeded client" 200 -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"kestrel_dev@example.com","password":"password123"}'
CLIENT_TOKEN=$(J 'd["access_token"]')

check "login seeded artist (mira_oku)" 200 -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"email":"mira_oku@example.com","password":"password123"}'
MIRA_TOKEN=$(J 'd["access_token"]')

check "GET /auth/me without token -> 401" 401 "$BASE/auth/me"
check "GET /auth/me with junk token -> 401" 401 "$BASE/auth/me" -H 'Authorization: Bearer not.a.token'
check "GET /auth/me (artist)" 200 "$BASE/auth/me" -H "Authorization: Bearer $MIRA_TOKEN"
echo "       handle: $(J 'd["artist_profile"]["handle"]')  password_hash absent: $(J '"password_hash" not in d')"

check "PATCH /auth/me (display_name + age_verified)" 200 -X PATCH "$BASE/auth/me" \
  -H "Authorization: Bearer $CLIENT_TOKEN" -H 'Content-Type: application/json' \
  -d '{"display_name":"Kestrel (smoke)","age_verified":true}'
echo "       age_verified now: $(J 'd["age_verified"]')"

check "POST /auth/logout -> 204" 204 -X POST "$BASE/auth/logout" -H "Authorization: Bearer $CLIENT_TOKEN"

head_ "Artist discovery: filters"
check "GET /artists (default page)" 200 "$BASE/artists"
echo "       total=$(J 'd["total"]') page_size=$(J 'd["page_size"]') first=$(J 'd["items"][0]["handle"]')"

check "filter styles=anime,chibi (ANY match)" 200 "$BASE/artists?styles=anime,chibi"
echo "       total=$(J 'd["total"]')"

check "filter commission_types=emote_set" 200 "$BASE/artists?commission_types=emote_set"
echo "       total=$(J 'd["total"]')"

check "price overlap 0-50" 200 "$BASE/artists?price_min=0&price_max=50"
echo "       total=$(J 'd["total"]') -> $(J '", ".join(a["handle"] for a in d["items"])')"

check "max_turnaround_days=7" 200 "$BASE/artists?max_turnaround_days=7"
echo "       total=$(J 'd["total"]')"

check "open_only=true" 200 "$BASE/artists?open_only=true"
echo "       total=$(J 'd["total"]') (3 seeded artists are closed)"

check "free-text q=tattoo" 200 "$BASE/artists?q=tattoo"
echo "       -> $(J '", ".join(a["handle"] for a in d["items"])')"

check "free-text q=PIXEL (case-insensitive)" 200 "$BASE/artists?q=PIXEL"
echo "       -> $(J '", ".join(a["handle"] for a in d["items"])')"

check "impossible combo returns empty page" 200 "$BASE/artists?styles=pixel_art&price_min=1000"
echo "       total=$(J 'd["total"]') items=$(J 'len(d["items"])')"

head_ "Artist discovery: sorting"
for s in recommended rating price_low price_high newest; do
  check "sort=$s" 200 "$BASE/artists?sort=$s&page_size=3"
  echo "       $(J '"  ".join(a["handle"]+"("+str(a["rating_avg"])+" / $"+str(a["price_min"])+")" for a in d["items"])')"
done
check "invalid sort -> 422" 422 "$BASE/artists?sort=cheapest"

head_ "Artist discovery: pagination"
check "page=1&page_size=5" 200 "$BASE/artists?page=1&page_size=5&sort=newest"
P1=$(J '",".join(a["handle"] for a in d["items"])')
check "page=2&page_size=5" 200 "$BASE/artists?page=2&page_size=5&sort=newest"
P2=$(J '",".join(a["handle"] for a in d["items"])')
[[ "$P1" != "$P2" ]] && printf '  %s pages differ (no overlap)\n' "$(c '0;32' 'PASS')" && PASS=$((PASS+1)) \
  || { printf '  %s pages identical\n' "$(c '0;31' 'FAIL')"; FAIL=$((FAIL+1)); }
check "page_size over max -> 422" 422 "$BASE/artists?page_size=500"

head_ "Restricted content gate (3 conditions, all required)"
check "anonymous: restricted artists excluded" 200 "$BASE/artists?page_size=50"
ANON=$(J '"crimsonvow" in [a["handle"] for a in d["items"]]')
[[ "$ANON" == "false" ]] && printf '  %s crimsonvow absent for anonymous\n' "$(c '0;32' 'PASS')" && PASS=$((PASS+1)) \
  || { printf '  %s crimsonvow leaked to anonymous\n' "$(c '0;31' 'FAIL')"; FAIL=$((FAIL+1)); }

check "anonymous + include_restricted=true: still excluded" 200 "$BASE/artists?include_restricted=true&page_size=50"
ANON2=$(J '"crimsonvow" in [a["handle"] for a in d["items"]]')
[[ "$ANON2" == "false" ]] && printf '  %s flag alone does not unlock\n' "$(c '0;32' 'PASS')" && PASS=$((PASS+1)) \
  || { printf '  %s flag alone unlocked restricted content\n' "$(c '0;31' 'FAIL')"; FAIL=$((FAIL+1)); }

check "login unverified client" 200 -X POST "$BASE/auth/login" \
  -H 'Content-Type: application/json' -d '{"email":"mossyfern@example.com","password":"password123"}'
UNVERIFIED_TOKEN=$(J 'd["access_token"]')
check "reset age_verified to false" 200 -X PATCH "$BASE/auth/me" \
  -H "Authorization: Bearer $UNVERIFIED_TOKEN" -H 'Content-Type: application/json' \
  -d '{"age_verified":false}'

check "authed but not age_verified + flag: excluded" 200 \
  "$BASE/artists?include_restricted=true&page_size=50" -H "Authorization: Bearer $UNVERIFIED_TOKEN"
U=$(J '"crimsonvow" in [a["handle"] for a in d["items"]]')
[[ "$U" == "false" ]] && printf '  %s unverified account does not unlock\n' "$(c '0;32' 'PASS')" && PASS=$((PASS+1)) \
  || { printf '  %s unverified account unlocked restricted\n' "$(c '0;31' 'FAIL')"; FAIL=$((FAIL+1)); }

check "verify age" 200 -X PATCH "$BASE/auth/me" -H "Authorization: Bearer $UNVERIFIED_TOKEN" \
  -H 'Content-Type: application/json' -d '{"age_verified":true}'
check "verified WITHOUT flag: still excluded" 200 "$BASE/artists?page_size=50" \
  -H "Authorization: Bearer $UNVERIFIED_TOKEN"
V1=$(J '"crimsonvow" in [a["handle"] for a in d["items"]]')
[[ "$V1" == "false" ]] && printf '  %s verification alone does not unlock\n' "$(c '0;32' 'PASS')" && PASS=$((PASS+1)) \
  || { printf '  %s verification alone unlocked restricted\n' "$(c '0;31' 'FAIL')"; FAIL=$((FAIL+1)); }

check "verified + flag: NOW included" 200 "$BASE/artists?include_restricted=true&page_size=50" \
  -H "Authorization: Bearer $UNVERIFIED_TOKEN"
V2=$(J '"crimsonvow" in [a["handle"] for a in d["items"]]')
[[ "$V2" == "true" ]] && printf '  %s all three conditions -> restricted visible\n' "$(c '0;32' 'PASS')" && PASS=$((PASS+1)) \
  || { printf '  %s restricted still hidden with all conditions met\n' "$(c '0;31' 'FAIL')"; FAIL=$((FAIL+1)); }

head_ "Restricted images stripped from the profile"
check "GET /artists/crimsonvow anonymous" 200 "$BASE/artists/crimsonvow"
echo "       sheet_images=$(J 'len(d["sheet_images"])') content_tags=$(J '",".join(d["content_tags"])') has_restricted=$(J 'd["has_restricted_content"]')"
check "GET /artists/crimsonvow verified + flag" 200 \
  "$BASE/artists/crimsonvow?include_restricted=true" -H "Authorization: Bearer $UNVERIFIED_TOKEN"
echo "       sheet_images=$(J 'len(d["sheet_images"])') content_tags=$(J '",".join(d["content_tags"])')"

head_ "Artist detail"
check "GET /artists/mira_oku" 200 "$BASE/artists/mira_oku"
echo "       offerings=$(J 'len(d["offerings"])') sheets=$(J 'len(d["sheet_images"])') folio=$(J 'len(d["portfolio_images"])')"
echo "       tags: styles=$(J 'len(d["tags"]["styles"])') content=$(J 'len(d["tags"]["content_tags"])') types=$(J 'len(d["tags"]["commission_types"])')"
echo "       rating distribution: $(J '" ".join(str(b["stars"])+"star:"+str(b["count"]) for b in d["rating_distribution"])')"
echo "       other user email exposed: $(J '"email" in d["user"]')"
check "GET /artists/does_not_exist -> 404" 404 "$BASE/artists/does_not_exist"
echo "       code: $(J 'd["code"]')"

head_ "Artist self-management (ownership from token)"
check "PUT /artists/me as client -> 403" 403 -X PUT "$BASE/artists/me" \
  -H "Authorization: Bearer $UNVERIFIED_TOKEN" -H 'Content-Type: application/json' \
  -d '{"tagline":"nope"}'
echo "       code: $(J 'd["code"]')"

check "PUT /artists/me unauthenticated -> 401" 401 -X PUT "$BASE/artists/me" \
  -H 'Content-Type: application/json' -d '{"tagline":"nope"}'

check "PUT /artists/me (new artist)" 200 -X PUT "$BASE/artists/me" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"tagline":"Smoke test studio","bio":"Built by the smoke test.","location":"Testville","languages":["English"],"terms_of_service":"Half up front.","is_open":true,"slots_open":2,"slots_total":4,"turnaround_days":9,"price_min":"40.00","price_max":"180.00","currency":"USD","tag_slugs":["anime","chibi","oc_friendly","bust","icon"]}'
echo "       handle=$(J 'd["handle"]') price=$(J 'd["price_min"]')-$(J 'd["price_max"]')"

check "PUT /artists/me invalid price range -> 422" 422 -X PUT "$BASE/artists/me" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"price_min":"500.00","price_max":"100.00"}'

check "handle collision -> 409" 409 -X PUT "$BASE/artists/me" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"handle":"mira_oku","price_min":"40.00","price_max":"180.00"}'
echo "       code: $(J 'd["code"]')"

head_ "Offerings CRUD"
check "POST offering -> 201" 201 -X POST "$BASE/artists/me/offerings" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"commission_type":"bust","title":"Smoke bust","description":"A bust.","price":"45.00","delivery_days":5}'
OFFER1=$(J 'd["id"]')
check "POST second offering -> 201" 201 -X POST "$BASE/artists/me/offerings" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"commission_type":"icon","title":"Smoke icon","price":"20.00","delivery_days":3}'
OFFER2=$(J 'd["id"]')

check "PATCH offering" 200 -X PATCH "$BASE/artists/me/offerings/$OFFER1" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d '{"price":"55.00","title":"Smoke bust (updated)"}'
echo "       price now $(J 'd["price"]'), title $(J 'd["title"]')"

check "PUT reorder offerings" 200 -X PUT "$BASE/artists/me/offerings/reorder" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"ids\":[\"$OFFER2\",\"$OFFER1\"]}"
echo "       order: $(J '"  ".join(str(o["sort_order"])+":"+o["title"] for o in d)')"

check "PATCH someone else's offering -> 404 (not 403)" 404 -X PATCH "$BASE/artists/me/offerings/$OFFER1" \
  -H "Authorization: Bearer $MIRA_TOKEN" -H 'Content-Type: application/json' -d '{"price":"1.00"}'
echo "       code: $(J 'd["code"]')  <- 404 hides whether the id exists"

check "reorder with a foreign id -> 404" 404 -X PUT "$BASE/artists/me/offerings/reorder" \
  -H "Authorization: Bearer $MIRA_TOKEN" -H 'Content-Type: application/json' \
  -d "{\"ids\":[\"$OFFER1\"]}"

check "DELETE offering -> 204" 204 -X DELETE "$BASE/artists/me/offerings/$OFFER2" \
  -H "Authorization: Bearer $ARTIST_TOKEN"
check "DELETE again -> 404" 404 -X DELETE "$BASE/artists/me/offerings/$OFFER2" \
  -H "Authorization: Bearer $ARTIST_TOKEN"

head_ "Sheet images and portfolio images"
for KIND in sheet-images portfolio-images; do
  check "POST $KIND -> 201" 201 -X POST "$BASE/artists/me/$KIND" \
    -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
    -d "{\"url\":\"https://picsum.photos/seed/smoke-$KIND/900/1200\",\"caption\":\"Smoke $KIND\",\"sort_order\":0}"
  IMG_A=$(J 'd["id"]')
  check "POST $KIND second -> 201" 201 -X POST "$BASE/artists/me/$KIND" \
    -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
    -d "{\"url\":\"https://picsum.photos/seed/smoke-$KIND-2/900/1200\",\"sort_order\":1}"
  IMG_B=$(J 'd["id"]')
  check "PATCH $KIND (mark restricted)" 200 -X PATCH "$BASE/artists/me/$KIND/$IMG_A" \
    -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
    -d '{"caption":"Updated caption","is_restricted":true}'
  check "PUT $KIND/reorder" 200 -X PUT "$BASE/artists/me/$KIND/reorder" \
    -H "Authorization: Bearer $ARTIST_TOKEN" -H 'Content-Type: application/json' \
    -d "{\"ids\":[\"$IMG_B\",\"$IMG_A\"]}"
  check "PATCH $KIND owned by another artist -> 404" 404 -X PATCH "$BASE/artists/me/$KIND/$IMG_A" \
    -H "Authorization: Bearer $MIRA_TOKEN" -H 'Content-Type: application/json' -d '{"caption":"hijack"}'
  check "DELETE $KIND -> 204" 204 -X DELETE "$BASE/artists/me/$KIND/$IMG_B" \
    -H "Authorization: Bearer $ARTIST_TOKEN"
done

head_ "Uploads (magic-byte validation)"
TMP="./.smoke-tmp"
rm -rf "$TMP"; mkdir -p "$TMP"
printf '\x89PNG\r\n\x1a\n%s' "$(head -c 200 /dev/urandom | base64)" > "$TMP/real.png"
printf 'GIF89a%s' "$(head -c 64 /dev/urandom | base64)" > "$TMP/real.gif"
printf '<html><script>alert(1)</script></html>' > "$TMP/fake.png"

check "upload without auth -> 401" 401 -X POST "$BASE/uploads" -F "file=@$TMP/real.png"
check "upload real PNG -> 201" 201 -X POST "$BASE/uploads" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -F "file=@$TMP/real.png"
UPLOAD_URL=$(J 'd["url"]')
echo "       url=$UPLOAD_URL size=$(J 'd["size"]') type=$(J 'd["content_type"]')"
echo "       stored name is a UUID, not 'real.png': $(J 'd["filename"]')"

check "upload real GIF -> 201" 201 -X POST "$BASE/uploads" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -F "file=@$TMP/real.gif"

check "upload HTML disguised as image/png -> 415" 415 -X POST "$BASE/uploads" \
  -H "Authorization: Bearer $ARTIST_TOKEN" -F "file=@$TMP/fake.png;type=image/png"
echo "       code: $(J 'd["code"]')  <- content-type header was ignored"

check "serve the uploaded file" 200 "http://localhost:8000$UPLOAD_URL"
rm -rf "$TMP"

head_ "Personalised 'recommended' sort"
check "recommended, anonymous (rating desc fallback)" 200 "$BASE/artists?sort=recommended&page_size=5"
echo "       $(J '"  ".join(a["handle"]+"("+str(a["rating_avg"])+")" for a in d["items"])')"
check "recommended, signed in" 200 "$BASE/artists?sort=recommended&page_size=5" \
  -H "Authorization: Bearer $MIRA_TOKEN"
echo "       $(J '"  ".join(a["handle"] for a in d["items"])')"

head_ "Cleanup"
rm -rf "$TMP"
"$PY_BIN" scripts/cleanup_smoke.py

printf '\n%s\n' "$(printf '%.0s─' {1..70})"
printf '  %s passed, %s failed\n\n' "$(c '1;32' "$PASS")" "$([[ $FAIL -gt 0 ]] && c '1;31' "$FAIL" || c '1;32' '0')"
[[ $FAIL -eq 0 ]] || exit 1
