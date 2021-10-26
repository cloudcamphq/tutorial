FROM public.ecr.aws/bitnami/node:latest
COPY . /app
WORKDIR /app
RUN npm install
EXPOSE 8080
CMD npm run start
