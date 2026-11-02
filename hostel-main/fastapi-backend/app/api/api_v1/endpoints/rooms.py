from fastapi import APIRouter, HTTPException, Depends
from typing import Any, List, Optional
from app.api.deps import get_current_user
from app.schemas.room import RoomCreate, RoomUpdate
from app.db.supabase import supabase

router = APIRouter()

@router.get("/")
def get_rooms(
    block: Optional[str] = None,
    status: Optional[str] = None,
    roomType: Optional[str] = None,
    gender: Optional[str] = None,
    search: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
) -> Any:
    query = supabase.table("rooms").select("*")
    
    if block:
        query = query.ilike("block", f"%{block}%")
    if status:
        query = query.eq("status", status)
    if roomType:
        query = query.eq("room_type", roomType)
    if gender:
        query = query.eq("gender_restriction", gender)
    if search:
        # Note: or_ syntax for supabase python: .or_("room_number.ilike.%search%,block.ilike.%search%")
        query = query.or_(f"room_number.ilike.%{search}%,block.ilike.%{search}%")
        
    res = query.execute()
    rooms = res.data

    # Populate occupants manually to mirror Node logic
    # Fetch all active allocations and students in one go if possible
    room_ids = [str(r["id"]) for r in rooms]
    if room_ids:
        alloc_res = supabase.table("room_allocations").select("*").eq("status", "ACTIVE").in_("room_id", room_ids).execute()
        allocations = alloc_res.data
        
        if allocations:
            student_ids = [str(a["student_id"]) for a in allocations]
            student_res = supabase.table("students").select("*").in_("id", student_ids).execute()
            students = {str(s["id"]): s for s in student_res.data}
            
            for room in rooms:
                room_allocs = [a for a in allocations if str(a["room_id"]) == str(room["id"])]
                occupants = []
                for a in room_allocs:
                    s = students.get(str(a["student_id"]))
                    if s:
                        occupants.append({
                            "id": s["id"],
                            "name": s["name"],
                            "register_number": s["register_number"],
                            "department": s["department"]
                        })
                room["occupants"] = occupants
        else:
            for room in rooms:
                room["occupants"] = []
    
    return rooms

@router.post("/")
def create_room(room_in: RoomCreate, current_user: dict = Depends(get_current_user)) -> Any:
    if current_user.get("role") not in ["ADMIN", "WARDEN"]:
        raise HTTPException(status_code=403, detail="Not authorized to create rooms")
        
    # Check existing
    check = supabase.table("rooms").select("id").ilike("room_number", room_in.room_number).execute()
    if check.data:
        raise HTTPException(status_code=400, detail="Room number already exists.")
        
    try:
        res = supabase.table("rooms").insert({
            "room_number": room_in.room_number.strip(),
            "block": room_in.block.strip(),
            "floor": room_in.floor,
            "room_type": room_in.room_type,
            "bathroom_type": room_in.bathroom_type,
            "ac_type": room_in.ac_type,
            "capacity": room_in.capacity,
            "current_occupancy": 0,
            "gender_restriction": room_in.gender_restriction,
            "status": "AVAILABLE"
        }).execute()
        return {"message": "Room created successfully!", "room": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to create room.")

@router.put("/{room_id}")
def update_room(room_id: int, room_in: RoomUpdate, current_user: dict = Depends(get_current_user)) -> Any:
    if current_user.get("role") not in ["ADMIN", "WARDEN"]:
        raise HTTPException(status_code=403, detail="Not authorized to update rooms")
        
    update_data = {k: v for k, v in room_in.model_dump().items() if v is not None}
    if not update_data:
        return {"message": "Nothing to update"}
        
    try:
        res = supabase.table("rooms").update(update_data).eq("id", room_id).execute()
        if not res.data:
            raise HTTPException(status_code=404, detail="Room not found.")
        return {"message": "Room updated successfully!", "room": res.data[0]}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to update room.")

@router.delete("/{room_id}")
def delete_room(room_id: int, current_user: dict = Depends(get_current_user)) -> Any:
    if current_user.get("role") not in ["ADMIN", "WARDEN"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete rooms")
        
    room_res = supabase.table("rooms").select("*").eq("id", room_id).execute()
    if not room_res.data:
        raise HTTPException(status_code=404, detail="Room not found.")
        
    room = room_res.data[0]
    if int(room.get("current_occupancy", 0)) > 0:
        raise HTTPException(status_code=400, detail="Cannot delete room with active occupants. Vacate room first.")
        
    try:
        supabase.table("rooms").delete().eq("id", room_id).execute()
        return {"message": "Room deleted successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to delete room.")
