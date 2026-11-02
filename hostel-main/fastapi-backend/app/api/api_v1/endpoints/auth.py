from fastapi import APIRouter, HTTPException, status, Depends
from typing import Any
import math
import random
from datetime import datetime, timedelta

from app.schemas.auth import LoginRequest, RegisterRequest, VerifyOtpRequest, Token
from app.core.security import verify_password, get_password_hash, create_access_token
from app.db.supabase import supabase

router = APIRouter()

@router.post("/login", response_model=dict)
def login(request: LoginRequest) -> Any:
    identifier = (request.email or request.phone or request.registerNumber or "").strip().lower()
    if not identifier or not request.password:
        raise HTTPException(status_code=400, detail="Email, Register Number, or Phone and password are required.")

    user = None

    # Try lookup by email
    if "@" in identifier:
        response = supabase.table("users").select("*").eq("email", identifier).execute()
        if response.data:
            user = response.data[0]

    # Try lookup by Register Number (for students)
    if not user:
        student_resp = supabase.table("students").select("*").ilike("register_number", identifier).execute()
        if student_resp.data:
            user_id = student_resp.data[0]["user_id"]
            user_resp = supabase.table("users").select("*").eq("id", user_id).execute()
            if user_resp.data:
                user = user_resp.data[0]
                
    # Try lookup by Phone
    if not user:
        clean_digits = "".join(filter(str.isdigit, identifier))
        last_10 = clean_digits[-10:] if len(clean_digits) >= 10 else ""
        if len(last_10) == 10:
            student_resp = supabase.table("students").select("*").ilike("phone", f"%{last_10}").execute()
            if student_resp.data:
                user_id = student_resp.data[0]["user_id"]
                user_resp = supabase.table("users").select("*").eq("id", user_id).execute()
                if user_resp.data:
                    user = user_resp.data[0]
            else:
                warden_resp = supabase.table("wardens").select("*").ilike("phone", f"%{last_10}").execute()
                if warden_resp.data:
                    user_id = warden_resp.data[0]["user_id"]
                    user_resp = supabase.table("users").select("*").eq("id", user_id).execute()
                    if user_resp.data:
                        user = user_resp.data[0]

    if not user:
        raise HTTPException(status_code=401, detail="No account found matching this Email, Register Number, or Phone.")

    # Verify Password
    if not verify_password(request.password, user.get("password_hash")):
        raise HTTPException(status_code=401, detail="Invalid password. Please check your credentials.")

    # Fetch profile
    profile = None
    if user.get("role") == "STUDENT":
        s_resp = supabase.table("students").select("*").eq("user_id", user["id"]).execute()
        if s_resp.data:
            profile = s_resp.data[0]
    elif user.get("role") == "WARDEN":
        w_resp = supabase.table("wardens").select("*").eq("user_id", user["id"]).execute()
        if w_resp.data:
            profile = w_resp.data[0]

    token = create_access_token({"id": user["id"], "email": user["email"], "role": user["role"], "profileId": profile["id"] if profile else None})

    return {
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "role": user["role"],
            "isVerified": user["is_verified"],
            "profile": profile
        }
    }

@router.post("/register")
def register(request: RegisterRequest) -> Any:
    clean_email = request.email.strip().lower()
    clean_role = (request.role or "STUDENT").upper()

    # Enforce domain
    if clean_role == "STUDENT" and not clean_email.endswith("@srishakthi.ac.in"):
        raise HTTPException(status_code=400, detail="Registration restricted: Students must use their official college email ending with @srishakthi.ac.in")

    # Check duplicate
    check_resp = supabase.table("users").select("id").eq("email", clean_email).execute()
    if check_resp.data:
        raise HTTPException(status_code=400, detail="Email is already registered in the system.")

    password_hash = get_password_hash(request.password)
    otp = str(random.randint(100000, 999999))
    otp_expires = (datetime.utcnow() + timedelta(minutes=10)).isoformat()

    try:
        user_insert = supabase.table("users").insert({
            "email": clean_email,
            "password_hash": password_hash,
            "role": clean_role,
            "is_verified": True, # Matches node logic
            "otp": otp,
            "otp_expires_at": otp_expires
        }).execute()
        
        new_user = user_insert.data[0]
        
        if clean_role == "STUDENT":
            reg_no = request.registerNumber or f"REG-{str(datetime.utcnow().timestamp())[-6:]}"
            supabase.table("students").insert({
                "user_id": new_user["id"],
                "name": request.name.strip(),
                "register_number": reg_no.strip(),
                "phone": request.phone.strip() if request.phone else "",
                "department": request.department or "Computer Science & Engineering",
                "course": request.course or "B.Tech CS",
                "year": request.year or 1,
                "gender": request.gender or "Male",
                "dob": request.dob or "2003-01-01",
                "blood_group": "O+",
                "parent_name": request.parentName.strip() if request.parentName else "",
                "parent_phone": request.parentPhone.strip() if request.parentPhone else "",
                "address": request.address.strip() if request.address else "",
                "emergency_contact": request.parentPhone or request.phone or ""
            }).execute()
            
        elif clean_role == "WARDEN":
            emp_id = request.employeeId or f"EMP-{str(datetime.utcnow().timestamp())[-5:]}"
            supabase.table("wardens").insert({
                "user_id": new_user["id"],
                "name": request.name.strip(),
                "employee_id": emp_id.strip(),
                "phone": request.phone.strip() if request.phone else "",
                "block_assigned": request.blockAssigned or "Block A (Boys Hostel)",
                "designation": request.designation or "Hostel Warden"
            }).execute()
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {
        "message": "Registration successful! Your account is active. You can log in now.",
        "userId": new_user["id"],
        "email": new_user["email"],
        "otp": otp,
        "isVerified": True,
        "otpSent": True
    }
