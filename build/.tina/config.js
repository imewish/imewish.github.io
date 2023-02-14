import { defineConfig } from "tinacms";

// Your hosting provider likely exposes this as an environment variable
const branch = process.env.HEAD || process.env.VERCEL_GIT_COMMIT_REF || "main";

export default defineConfig({
  branch,
  clientId: "71551ff3-047c-42d7-8a96-e96d5903fc2d", // Get this from tina.io
  token: "2f49f78600b09b8eecd6e27aafd7463c86dd3674", // Get this from tina.io
  build: {
    outputFolder: "admin",
    publicFolder: "static",
  },
  media: {
    tina: {
      mediaRoot: "",
      publicFolder: "static",
    },
  },
  schema: {
    collections: [
      {
        label: "Pages",
        name: "pages",
        path: "content",
        fields: [
          {
            type: "rich-text",
            name: "body",
            label: "Body of Document",
            description: "This is the markdown body",
            isBody: true,
          },
        ],
      },
      {
        label: "Posts",
        name: "posts",
        path: "content/posts",
        fields: [
          {
            type: "rich-text",
            name: "body",
            label: "Body of Document",
            description: "This is the markdown body",
            isBody: true,
          },
          {
            type: "string",
            name: "tags",
            label: "tags",
            list: true,
          },
          {
            type: "string",
            name: "layout",
            label: "layout",
          },
          {
            type: "string",
            name: "title",
            label: "title",
          },
          {
            type: "string",
            name: "permalink",
            label: "permalink",
          },
          {
            type: "datetime",
            name: "date",
            label: "date",
          },
          {
            type: "image",
            name: "image_upload",
            label: "Image Upload",
          },
        ],
      },
    ],
  },
});
