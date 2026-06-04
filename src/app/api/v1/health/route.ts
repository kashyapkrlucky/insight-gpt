export async function GET() {
  try {
    return new Response("OK");
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
