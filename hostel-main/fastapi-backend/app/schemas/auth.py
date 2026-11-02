from pydantic import BaseModel, EmailStr
from typing import Optional

class LoginRequest(BaseModel):
    email: Optional[str] = None
    phone: Optional[str] = None
    registerNumber: Optional[str] = None
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    role: Optional[str] = "STUDENT"
    name: str
    registerNumber: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    year: Optional[int] = None
    gender: Optional[str] = None
    dob: Optional[str] = None
    parentName: Optional[str] = None
    parentPhone: Optional[str] = None
    address: Optional[str] = None
    employeeId: Optional[str] = None
    blockAssigned: Optional[str] = None
    designation: Optional[str] = None

class VerifyOtpRequest(BaseModel):
    email: EmailStr
    otp: str

class Token(BaseModel):
    access_token: str
    token_type: str
