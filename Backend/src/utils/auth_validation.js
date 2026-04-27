const validator = require('validator')
const auth_validate = (data)=>{
    const mandatoryField = ['firstName', 'password', 'emailId'];
    const isAllowed = mandatoryField.every((k)=>Object.keys(data).includes(k))
    if(!isAllowed)
        throw new Error('Required field missing')

    if(!validator.isEmail(data.emailId))
        throw new Error('Invalid Email')
    if(!validator.isStrongPassword(data.password))
        throw new Error('Enter strong password')

    if(data.firstName.length<3 || data.firstName.length>20)
        throw new Error('Enter valid name')

    if(data.age<8 || data.age>100)
        throw new Error('Enter valid age')
}

module.exports = auth_validate;