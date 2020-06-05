# Start hydra
docker-compose -f hydra-dev.yml up --build

 # Let's create the OAuth 2.0 Client:
# we will perform the OAuth 2.0 Authorization Code Grant.
docker-compose -f hydra-dev.yml exec hydra \
    hydra clients create \
    --endpoint http://localhost:4444 \
    --id app-bbva \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks http://127.0.0.1:9010/callback

# Run the client
docker-compose -f hydra-dev.yml exec hydra \
    hydra token user \
    --client-id app-demo \
    --client-secret secret \
    --endpoint http://127.0.0.1:4444/ \
    --port 3022 \
    --scope openid,offline

# Issue with example, run client installing hydra
    hydra token user \
    --skip-tls-verify \
    --endpoint http://127.0.0.1:9000 \
    --port 9010 \
    --auth-url http://127.0.0.1:9000/oauth2/auth \
    --token-url http://127.0.0.1:9000/oauth2/token \
    --client-id testing1 \
    --client-secret some-secret \
    --scope openid,offline

<!-- # Process -->
hydra clients create \
    --endpoint http://127.0.0.1:9001 \
    --id app-bbva2 \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks http://127.0.0.1:9010/callback


hydra token user \
    --skip-tls-verify \
    --endpoint http://127.0.0.1:9000 \
    --port 9010 \
    --auth-url http://127.0.0.1:9000/oauth2/auth \
    --token-url http://127.0.0.1:9000/oauth2/token \
    --client-id app-bbva2 \
    --client-secret some-secret \
    --scope openid,offline
