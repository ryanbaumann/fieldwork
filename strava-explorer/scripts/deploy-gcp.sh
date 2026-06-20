#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${GCP_PROJECT_ID:-geojson-bq-blog}"
ACCOUNT="${GCLOUD_ACCOUNT:-rsbaumann@gmail.com}"
REGION="${GCP_REGION:-us-central1}"
LOCATION="${GCS_LOCATION:-US}"
BUCKET="${GCS_BUCKET:-${PROJECT_ID}-strava-explorer}"
SERVICE="${CLOUD_RUN_SERVICE:-strava-explorer-broker}"
PUBLIC="${GCS_PUBLIC:-true}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --project) PROJECT_ID="$2"; shift 2 ;;
    --account) ACCOUNT="$2"; shift 2 ;;
    --region) REGION="$2"; shift 2 ;;
    --location) LOCATION="$2"; shift 2 ;;
    --bucket) BUCKET="$2"; shift 2 ;;
    --service) SERVICE="$2"; shift 2 ;;
    --private) PUBLIC="false"; shift ;;
    --public) PUBLIC="true"; shift ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

if ! command -v gcloud >/dev/null 2>&1; then
  echo "gcloud CLI is required. Install Google Cloud SDK and run: gcloud auth login $ACCOUNT" >&2
  exit 127
fi

for name in STRAVA_CLIENT_SECRET VITE_STRAVA_CLIENT_ID VITE_GMP_API_KEY; do
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required environment variable: $name" >&2
    exit 2
  fi
done

gcloud config set account "$ACCOUNT" >/dev/null
gcloud config set project "$PROJECT_ID" >/dev/null

gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com storage.googleapis.com secretmanager.googleapis.com maps-backend.googleapis.com tile.googleapis.com elevation-backend.googleapis.com --project "$PROJECT_ID"

export VITE_STRAVA_REDIRECT_URI="${VITE_STRAVA_REDIRECT_URI:-https://storage.googleapis.com/${BUCKET}/index.html}"
FRONTEND_ORIGIN="$(node -e "console.log(new URL(process.env.VITE_STRAVA_REDIRECT_URI).origin)")"

if ! gcloud secrets describe strava-client-secret --project "$PROJECT_ID" >/dev/null 2>&1; then
  printf "%s" "$STRAVA_CLIENT_SECRET" | gcloud secrets create strava-client-secret --project "$PROJECT_ID" --replication-policy=automatic --data-file=- >/dev/null
else
  printf "%s" "$STRAVA_CLIENT_SECRET" | gcloud secrets versions add strava-client-secret --project "$PROJECT_ID" --data-file=- >/dev/null
fi

PROJECT_NUMBER="$(gcloud projects describe "$PROJECT_ID" --format="value(projectNumber)")"
gcloud secrets add-iam-policy-binding strava-client-secret \
  --project "$PROJECT_ID" \
  --member "serviceAccount:${PROJECT_NUMBER}-compute@developer.gserviceaccount.com" \
  --role roles/secretmanager.secretAccessor >/dev/null

BROKER_URL="$(gcloud run deploy "$SERVICE" \
  --source server \
  --project "$PROJECT_ID" \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "STRAVA_CLIENT_ID=${VITE_STRAVA_CLIENT_ID},ALLOWED_ORIGIN=${FRONTEND_ORIGIN}" \
  --set-secrets "STRAVA_CLIENT_SECRET=strava-client-secret:latest" \
  --format='value(status.url)')"

export VITE_STRAVA_AUTH_BASE_URL="$BROKER_URL"

PUBLIC_FLAG="--private"
if [[ "$PUBLIC" == "true" ]]; then
  PUBLIC_FLAG="--public"
fi
./scripts/deploy-gcs.sh --project "$PROJECT_ID" --bucket "$BUCKET" --location "$LOCATION" "$PUBLIC_FLAG"

echo "Cloud Run broker: $BROKER_URL"
echo "Static frontend: https://storage.googleapis.com/$BUCKET/index.html"
echo "Set the Strava app callback domain/redirect URI to match: $VITE_STRAVA_REDIRECT_URI"
