#!/bin/bash

if [ -f .env ]
then
  export $(cat .env | sed 's/#.*//g' | xargs)
fi

IFS=',' read -r -a databases <<< "$DATABASES"

for database in "${databases[@]}"; do
    echo "backing: $database"
    mysqldump "$database" -h "$DB_HOST" -u "$DB_USER" --password="$DB_PASS" | gzip > `date +"%Y-%m-%d"-$database.sql.gz` && \
    aws s3 cp `date +"%Y-%m-%d"-$database.sql.gz` "s3://$S3_REPO" && \
    rm `date +"%Y-%m-%d"-$database.sql.gz`
done

