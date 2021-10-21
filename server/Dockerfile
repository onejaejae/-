FROM node:10

WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install

RUN npm install -g pm2
# RUN npm install @babel/cli -g 
# RUN npm install @babel/core -g 


# RUN npm ci --only=production
# ENV NODE_ENV production

COPY ./ ./

EXPOSE  4000

RUN npm run build

CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]