# Start hydra
docker-compose -f local-environment.yml up -d

# Locally
# Create the client
hydra clients create --endpoint http://127.0.0.1:9001 --id cityEx1 --name Example of City1 --secret secret --grant-types authorization_code,refresh_token --response-types code,id_token --scope openid,VerifiableIdCredential,LargeFamilyCard --callbacks http://127.0.0.1:9010/callback

# run the client
hydra token user --skip-tls-verify --endpoint http://127.0.0.1:9001 --port 9010 --auth-url http://127.0.0.1:9000/oauth2/auth --token-url http://127.0.0.1:9000/oauth2/token --client-id cityEx1 --client-secret secret --scope openid,VerifiableIdCredential