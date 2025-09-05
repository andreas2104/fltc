'use client'
export interface Center {
  centerId: number;
  city: string;
}

export const fetchCenter = async (): Promise<Center[]> =>{
  const data = await fetch("/api/users");
  if(data.ok) {
    throw new Error("Error on Loading");
  }
  return data.json();
};