"use strict";

console.log("supabase-config.js loaded.");

(() => {
  const projectUrl =
    "https://xeduatczlwldfltqasfo.supabase.co";

  const publishableKey =
    "sb_publishable_ujjHI1nw_xY4iIq8gv6k9w_cC74ZnRQ";

  if (!window.supabase) {
    console.error(
      "The Supabase library did not load. Check the script order in index.html."
    );
    return;
  }

  if (
    projectUrl.includes("PASTE_") ||
    publishableKey.includes("PASTE_")
  ) {
    console.error(
      "Your Supabase URL or publishable key has not been entered."
    );
    return;
  }

  window.supabaseClient = window.supabase.createClient(
    projectUrl,
    publishableKey
  );

  console.log("Supabase client created successfully.");
})();