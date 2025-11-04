import { supabase } from "./supabase";

export async function uploadBookToSupabase(file: File) {
  const fileName = `${Date.now()}-${file.name}`;
  const { data, error } = await supabase.storage
    .from("books")
    .upload(fileName, file);

  if (error) throw new Error(error.message);

  const { data: publicUrl } = supabase.storage
    .from("books")
    .getPublicUrl(fileName);

  return publicUrl.publicUrl;
}
