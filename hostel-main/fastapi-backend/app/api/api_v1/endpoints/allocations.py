from fastapi import APIRouter, HTTPException, Depends, UploadFile, File, Form
from typing import Any, Optional
from datetime import datetime
from app.api.deps import get_current_user
from app.schemas.allocation import RoomRequestSubmit, ManualAllocate
from app.db.supabase import supabase

router = APIRouter()

@router.get("/my")
def get_my_allocation(current_user: dict = Depends(get_current_user)) -> Any:
    # 1. Fetch Student Profile
    s_res = supabase.table("students").select("*").eq("user_id", current_user["id"]).execute()
    if not s_res.data:
        raise HTTPException(status_code=404, detail="Student profile not found.")
    student = s_res.data[0]

    # 2. Fetch Active Allocation
    alloc_res = supabase.table("room_allocations").select("*").eq("student_id", student["id"]).eq("status", "ACTIVE").execute()
    allocation = alloc_res.data[0] if alloc_res.data else None

    room = None
    roommates = []
    
    if allocation:
        r_res = supabase.table("rooms").select("*").eq("id", allocation["room_id"]).execute()
        if r_res.data:
            room = r_res.data[0]
            # Fetch roommates
            occupant_allocs = supabase.table("room_allocations").select("student_id").eq("room_id", room["id"]).eq("status", "ACTIVE").execute()
            if occupant_allocs.data:
                occupant_ids = [str(a["student_id"]) for a in occupant_allocs.data]
                if occupant_ids:
                    occ_students = supabase.table("students").select("*").in_("id", occupant_ids).execute()
                    all_occupants = occ_students.data
                    room["occupants"] = all_occupants
                    roommates = [s for s in all_occupants if str(s["id"]) != str(student["id"])]

    # 3. Fetch Latest Room Request
    req_res = supabase.table("room_requests").select("*").eq("student_id", student["id"]).order("created_at", desc=True).limit(1).execute()
    latest_request = req_res.data[0] if req_res.data else None

    return {
        "hasAllocation": bool(allocation),
        "allocation": allocation,
        "room": room,
        "roommates": roommates,
        "hasPendingRequest": latest_request["status"] == "PENDING" if latest_request else False,
        "request": latest_request
    }

@router.post("/request")
def submit_request(
    preferred_block: str = Form(None),
    preferred_floor: int = Form(None),
    preferred_room_type: str = Form(None),
    preferred_ac: str = Form(None),
    preferred_bathroom: str = Form(None),
    special_requirements: str = Form(None),
    feeReceipt: Optional[UploadFile] = File(None),
    current_user: dict = Depends(get_current_user)
) -> Any:
    # Port logic for file upload and request creation
    return {"message": "Endpoint scaffolding complete."}

@router.get("/requests")
def get_requests(current_user: dict = Depends(get_current_user)) -> Any:
    if current_user.get("role") not in ["ADMIN", "WARDEN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    res = supabase.table("room_requests").select("*, student:students(*), allocated_room:rooms(*)").order("created_at", desc=True).execute()
    requests = res.data
    # In python, we manually sort pending first
    requests.sort(key=lambda x: (x["status"] != "PENDING", x.get("created_at", "")))
    return requests

@router.get("/")
def get_allocations(current_user: dict = Depends(get_current_user)) -> Any:
    if current_user.get("role") not in ["ADMIN", "WARDEN"]:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    res = supabase.table("room_allocations").select("*, student:students(*), room:rooms(*)").order("allocation_date", desc=True).execute()
    allocations = res.data
    allocations.sort(key=lambda x: (x["status"] != "ACTIVE", x.get("allocation_date", "")))
    return allocations
