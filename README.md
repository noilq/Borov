# Borov
 
## About The Project

Borov is a school project developed by a team of three individuals. It's a form-based application built with Node.js, Express.js, JWT for token authentication, and MySQL database. The frontend is built with CSS, jQuery, and JavaScript.

### Features
 * Backend Features:
   * CRUD endpoints with soft deletion for Users, Posts, and Comments.
   * JWT token authentication system.
   * Express-validator validation.
 * Frontend Features:
   * User authentication: registration, login, and updating account description.
   * Post management: create, delete, view, update and vote on posts.
   * Comment management: create, view, and vote on comments.

### Built With
 * Backend:
   * Node.js
   * Express.js
   * JWT
   * Express-validator
   * MySQL
 * Frontend:
   * HTML/CSS
   * JavaScript
   * jQuery

## Getting Started

To run the Borov application, follow these steps:

### Installation

1. Make sure you have Node.js installed.

2. Clone the project repository.
```sh
   git clone https://github.com/noilq/Borov.git
```
3. Install NPM packages
```sh
   npm install
```
4. Start the application.
```sh
   npm run dev
```

5. Once the application is running, you can access it at 
```sh
   http://localhost:5000/registration
```

6. You can explore the Swagger documentation for the API endpoints at 
```sh
   http://localhost:5000/docs
```

## Future plans 

In the future, we plan to add a Dockerfile to the project to enable autonomous deployment of the application.