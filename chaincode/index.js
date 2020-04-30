'use strict';

const UserContract = require('./UserContract.js');
const RegistrarContract = require('./RegistrarContract.js');

module.exports.UserContract = UserContract;
module.exports.RegistrarContract = RegistrarContract;

module.exports.contracts = [UserContract,RegistrarContract];