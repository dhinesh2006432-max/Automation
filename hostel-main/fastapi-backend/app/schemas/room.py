from pydantic import BaseModel
from typing import Optional

class RoomCreate(BaseModel):
    room_number: str
    block: str
    floor: int
    room_type: str
    bathroom_type: Optional[str] = 'Attached'
    ac_type: Optional[str] = 'Non-AC'
    capacity: Optional[int] = 2
    gender_restriction: Optional[str] = 'BOYS'

class RoomUpdate(BaseModel):
    block: Optional[str] = None
    floor: Optional[int] = None
    room_type: Optional[str] = None
    bathroom_type: Optional[str] = None
    ac_type: Optional[str] = None
    capacity: Optional[int] = None
    gender_restriction: Optional[str] = None
    status: Optional[str] = None
