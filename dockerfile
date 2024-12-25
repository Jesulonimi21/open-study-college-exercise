FROM node:18 as ts-compiler
WORKDIR /usr/src/ops-tsd
COPY package*.json ./
RUN npm install
COPY ./src ./src
COPY ./types ./
COPY ./*.json ./
RUN npm run build

FROM gcr.io/distroless/nodejs:18
WORKDIR /usr/src/ops-tsd
COPY --from=ts-compiler /usr/src/ops-tsd ./
CMD [ "./dist/index.js" ]