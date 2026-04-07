import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { imageUrl } = await req.json();
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "imageUrl is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch existing suppliers and categories for matching
    const [suppliersRes, categoriesRes] = await Promise.all([
      supabase.from("suppliers").select("id, name, gst_number"),
      supabase.from("categories").select("id, name"),
    ]);

    const existingSuppliers = suppliersRes.data || [];
    const existingCategories = categoriesRes.data || [];

    // Call AI to extract bill details
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are a bill/invoice data extractor for a children's clothing retail shop. Extract structured data from supplier bills/invoices.

Existing suppliers: ${JSON.stringify(existingSuppliers.map(s => ({ id: s.id, name: s.name, gst: s.gst_number })))}
Existing categories: ${JSON.stringify(existingCategories.map(c => ({ id: c.id, name: c.name })))}

Return a JSON object with:
{
  "supplier": {
    "name": "supplier name from bill",
    "gst_number": "GST number if visible",
    "phone": "phone if visible",
    "address": "address if visible",
    "matched_id": "id of existing supplier if name matches closely, else null"
  },
  "bill_date": "YYYY-MM-DD format date from bill",
  "bill_number": "invoice/bill number if visible",
  "items": [
    {
      "name": "product name/description",
      "quantity": 1,
      "wholesale_price": 100.00,
      "retail_price": 0,
      "size": "size if mentioned",
      "color": "color if mentioned",
      "brand": "brand if mentioned",
      "category_guess": "best matching category name from existing categories",
      "matched_category_id": "id if matches existing category, else null"
    }
  ],
  "total_amount": 0,
  "notes": "any additional notes from the bill"
}

Rules:
- Extract ALL line items from the bill
- wholesale_price is the per-piece cost from supplier
- If retail price isn't on the bill, set it to 0
- Match supplier names fuzzy (e.g. "Sharma Textiles" matches "Sharma Textile")
- Match categories to existing ones when possible
- All prices in INR (₹)
- Return ONLY valid JSON, no markdown`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: imageUrl }
              },
              {
                type: "text",
                text: "Extract all product details, supplier info, quantities, and prices from this supplier bill/invoice image."
              }
            ]
          }
        ],
        max_tokens: 4000,
        temperature: 0.1,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errText);
      if (aiResponse.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiResponse.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: "AI extraction failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse JSON from response (strip markdown fences if present)
    let extracted;
    try {
      const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      extracted = JSON.parse(jsonStr);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "Failed to parse bill data", raw: content }), {
        status: 422,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
