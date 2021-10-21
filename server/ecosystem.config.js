module.exports = {
  apps: [
    {
      name: "app",
      script: "./dist/app.js",
      instances: 2,
      exec_mode: "cluster",
      wait_ready: true,
      listen_timeout: 50000,
      kill_timeout: 5000,
    },
  ],
};
