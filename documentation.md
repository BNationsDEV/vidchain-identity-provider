# Start hydra
docker-compose -f hydra-dev.yml up --build

 # Create the client
 hydra clients create \
    --endpoint https://dev.api.vidchain.net \
    --id example \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks http://127.0.0.1:9010/callback

# run the client
hydra token user \
    --skip-tls-verify \
    --endpoint https://dev.api.vidchain.net \
    --port 9010 \
    --auth-url https://dev.api.vidchain.net/oauth2/auth \
    --token-url https://dev.api.vidchain.net/oauth2/token \
    --client-id example \
    --client-secret secret \
    --scope openid,offline

 # Locally
 # Create the client
 hydra clients create \
    --endpoint http://127.0.0.1:9001 \
    --id alex1234 \
    --name nameTest \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks http://127.0.0.1:9010/callback

# run the client
hydra token user \
    --skip-tls-verify \
    --endpoint http://127.0.0.1:9001 \
    --port 9010 \
    --auth-url http://127.0.0.1:9000/oauth2/auth \
    --token-url http://127.0.0.1:9000/oauth2/token \
    --client-id alex1234 \
    --client-secret secret \
    --scope openid,offline

# Example Barcelona
hydra clients create \
    --endpoint https://dev.api.vidchain.net \
    --id city \
    --name YourCity \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks https://dev.api.vidchain.net/demo/callback

hydra clients create \
    --endpoint https://dev.api.vidchain.net \
    --id city-test \
    --name YourCity \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks http://127.0.0.1:3022/demo/callback


hydra clients create \
    --endpoint https://dev.api.vidchain.net \
    --id university-demo \
    --name YourUniversity \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks http://localhost:3024/demo/callback
# Example Univeristy
    hydra clients create \
    --endpoint https://dev.api.vidchain.net \
    --id university \
    --name YourUniveristy \
    --secret secret \
    --grant-types authorization_code,refresh_token \
    --response-types code,id_token \
    --scope openid,offline \
    --callbacks https://dev.api.vidchain.net/universitydemo/callback





