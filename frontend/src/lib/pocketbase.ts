import PocketBase from "pocketbase";

const pbUrl = window.location.origin;
export const pb = new PocketBase(pbUrl);
