#!/bin/sh

kubectl apply -f postgres.yml
kubectl apply -f packages/hydra/k8s.yml
kubectl apply -f packages/identity-consent/k8s.yml