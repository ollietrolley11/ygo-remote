services:
  - type: web
    name: ygo-remote
    env: node
    plan: free
    buildCommand: npm install
    startCommand: npm start
    autoDeploy: false
    healthCheckPath: /health
    envVars:
      - key: NODE_VERSION
        value: 20
      - key: PUBLIC_BASE_URL
        sync: false
      - key: TURN_URL
        sync: false
      - key: TURN_USERNAME
        sync: false
      - key: TURN_CREDENTIAL
        sync: false
