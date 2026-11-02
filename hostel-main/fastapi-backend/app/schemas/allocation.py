from pydantic import BaseModel
from typing import Optional

class RoomRequestSubmit(BaseModel):
    preferred_block: Optional[str] = None
    preferred_floor: Optional[int] = None
    preferred_room_type: Optional[str] = None
    preferred_ac: Optional[str] = None
    preferred_bathroom: Optional[str] = None
    special_requirements: Optional[str] = None

class ManualAllocate(BaseModel):
    student_id: int
    room_id: int
