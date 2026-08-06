import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";

// loader = Admin API "read" example: runs on the server before the page renders,
// fetching the shop's real products via the Admin GraphQL API
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);

  const response = await admin.graphql(
    `#graphql
      query getProducts {
        products(first: 25, sortKey: CREATED_AT, reverse: true) {
          edges {
            node {
              id
              title
              status
              totalInventory
              featuredImage {
                url
                altText
              }
            }
          }
        }
      }`,
  );
  const { data } = await response.json();

  return { products: data.products.edges.map((edge) => edge.node) };
};

export default function Products() {
  const { products } = useLoaderData();

  return (
    <s-page heading="Products">
      <s-section heading={`${products.length} product(s) in this store`}>
        {products.length === 0 ? (
          <s-paragraph>
            No products yet in this store. Create one from the Shopify admin
            (Products &gt; Add product) and reload this page to see it here.
          </s-paragraph>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Image</s-table-header>
              <s-table-header>Title</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Inventory</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {products.map((product) => (
                <s-table-row key={product.id}>
                  <s-table-cell>
                    {product.featuredImage ? (
                      <img
                        src={product.featuredImage.url}
                        alt={product.featuredImage.altText || product.title}
                        width="40"
                        height="40"
                        style={{ objectFit: "cover", borderRadius: "4px" }}
                      />
                    ) : (
                      "—"
                    )}
                  </s-table-cell>
                  <s-table-cell>{product.title}</s-table-cell>
                  <s-table-cell>{product.status}</s-table-cell>
                  <s-table-cell>{product.totalInventory}</s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}
