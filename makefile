.PHONY: api web clean build

api:
	docker-compose run --rm --service-ports api /bin/bash

web:
	docker-compose run --rm --service-ports web /bin/bash

clean:
	find . -iname .DS_Store -delete

build_api: clean
	docker-compose build api
	docker-compose run --rm api pipenv run pytest || exit 1

deploy_api:
	aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 634573534101.dkr.ecr.us-east-1.amazonaws.com
	docker-compose push api
	sleep 2
	aws ecs update-service --cluster YayHooray --service API --force-new-deployment | cat

build_web: clean
	rm -rf ./web/dist
	MODE=production docker-compose run --rm web parcel build --no-cache

deploy_web:
	aws s3 sync ./web/dist/ s3://yayhooray-web/ --delete
	aws cloudfront create-invalidation --distribution-id E1QC3I599QZY00 --paths "/*" | cat

# make remote_shell task_id=8b53b9ef88c245fa...
remote_shell:
	# aws ecs describe-tasks --cluster YayHooray --tasks $(task_id)
	aws ecs execute-command --region us-east-1 --cluster YayHooray --task $(task_id) --container api --command "/bin/bash" --interactive

all: build_api build_web deploy_api deploy_web
