import {body, validationResult} from "express-validator";

function validate (req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array(),
            stack:errors.stack
         });
    }
    next(); 
}; 

export const registerValidator = [
    body("email").isEmail().withMessage("Please provide a valid email address."),
    // body("contact").notEmpty().withMessage("Contact is required.").matches(/^\d{10}$/).withMessage("Contact must be a 10-digit number."),
    body("password").isLength({ min: 4 }).withMessage("Password must be at least 4 characters long."),
    body("fullname").notEmpty().withMessage("Full name is required.").isLength({ min: 3 }).withMessage("Full name must be at least 3 characters long."),   
    body("iscustomer").optional().isBoolean().withMessage("Customer must be a boolean value."),
    
    validate
]   

export const businessRegisterValidator = [
    body("businessEmail").isEmail().withMessage("Please provide a valid email address."),
    // body("contact").notEmpty().withMessage("Contact is required.").matches(/^\d{10}$/).withMessage("Contact must be a 10-digit number."),
    body("businessPassword").isLength({ min: 4 }).withMessage("Password must be at least 4 characters long."),
    body("organization").notEmpty().withMessage("Full name is required.").isLength({ min: 3 }).withMessage("Full name must be at least 3 characters long."),   
    
    validate
]   

export const loginValidator = [
    body("email").isEmail().withMessage("Please provide a valid email address."),
    body("password").notEmpty().withMessage("Password is required."),   
    
    validate
]




