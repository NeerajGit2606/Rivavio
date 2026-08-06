import { authenticate } from "../shopify.server";

// Shopify calls this URL itself (server-to-server) whenever a product is
// created/edited on the store -- authenticate.webhook() verifies the request's
// HMAC signature against apiSecretKey before handing us the payload, so we know
// this really came from Shopify and wasn't spoofed by a random POST.
// (products/update carries no customer PII, unlike orders/* topics, which
// Shopify gates behind a separate "protected customer data" approval process.)
export const action = async ({ request }) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);
  console.log(`Product "${payload.title}" (id ${payload.id}) was updated`);

  return new Response();
};
