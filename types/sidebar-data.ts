import { Tables } from "@/supabase/types"

export type DataListType =
  | Tables<"collections">[]
  | Tables<"chats">[]
  | Tables<"files">[]

export type DataItemType =
  | Tables<"collections">
  | Tables<"chats">
  | Tables<"files">
