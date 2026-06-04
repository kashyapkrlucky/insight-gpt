export async function POST() {
  try {
    return new Response("Hello World");
  } catch {
    return new Response("Internal Server Error", { status: 500 });
  }
}
