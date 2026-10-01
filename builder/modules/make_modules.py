#!/usr/bin/env python3
"""Generate the tool categories file and the intake modules.

    python modules/make_modules.py

Writes:
  modules/categories.json          six service areas + custom, with the phrases that suggest each
  modules/<category>.json          guided intake for every category except Select & Recommend
It also adds 'implies' links to modules/select_recommend.json (answers that suggest other tools).
Select & Recommend's own questions stay hand-authored in select_recommend.json.
"""
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent

DOCUMENTS = [
    {"id": "purpose", "title": "Tool Purpose and Users"},
    {"id": "journey", "title": "Tool Journey and States"},
    {"id": "inputs", "title": "Inputs and Data Requirements"},
    {"id": "rules", "title": "Business Rules and Priorities"},
    {"id": "outputs", "title": "Outputs, Recommendations and Calls to Action"},
    {"id": "admin", "title": "Admin Editing Requirements"},
    {"id": "exceptions", "title": "Exceptions and Fallbacks"},
    {"id": "prototype", "title": "Prototype Scope"},
    {"id": "production", "title": "Production Scope"},
    {"id": "acceptance", "title": "Acceptance Tests"},
]

# Each pattern is a regular expression (matched on lower-cased text, word boundaries added) and the
# plain-language reason shown to the client. Weight 2 = strong signal, 1 = supporting signal.
CATEGORIES = [
    {"id": "configure", "name": "Configure & Visualise", "module": "configure", "prefix": "CV",
     "summary": "Customers build their own version of a product and see it change as they choose.",
     "patterns": [
         [r"customi[sz]\w*|personali[sz]\w*|bespoke|made[- ]to[- ](order|measure)|(build|design|create|make) (your|their|my) own", 2, "customers make their own version of a product"],
         [r"configur\w*|product builder|kit builder|spec(ification)? builder", 2, "the product is configured from options"],
         [r"visuali[sz]\w*|3d|augmented reality|\bar\b view|render(s|ing|ed)?|mock-?ups?|preview\w*|see (what|how) (it|they) (looks?|would look)", 2, "customers need to see the result before buying"],
         [r"(multiple|many|lots of|loads of|hundreds of|thousands of|different) (variables|variations|options|variants|sizes|materials|finishes|colou?rs|combinations|configurations|specs|specifications)", 2, "each product comes in many variations"],
         [r"\d[\d,]* (materials|sizes|finishes|fabrics|colou?rs|options|variants|combinations|configurations)", 2, "there are counted options, such as materials and sizes"],
         [r"engrav\w*|monogram\w*|print(ed)? (name|logo|text)|modular|bundles?|kits?", 1, "products are assembled or personalised"],
         [r"options|variants|add-?ons|variables|variations|finish(es)?|swatch\w*|fabrics?|colou?rways?", 1, "products come with options"],
         [r"materials?|sizes?|dimensions", 1, "size or material is part of the choice"],
     ]},
    {"id": "select", "name": "Select & Recommend", "module": "select_recommend", "prefix": "SR",
     "summary": "Guide customers to the right product with questions that eliminate options, plus filters and rules.",
     "patterns": [
         [r"which (one|product|model|size|screen|material|type|version)s?|the right \w+|best (one|option|fit|match)", 2, "customers need to find the right product"],
         [r"help(ing)? (them|customers|people|buyers|shoppers|users) (choose|pick|find|decide|select)", 2, "customers need help choosing"],
         [r"recommend\w*|suggest\w*|finder|selector|matchmak\w*|advis(or|er)|wizard|guided (selling|buying)|gift guide|size guide|fit finder", 2, "the tool recommends products"],
         [r"eliminat\w*|narrow(s|ing|ed)? (it |them |things |the (range|options|choice) )?down|questions?|questionnaire|quiz", 2, "questions narrow down the options"],
         [r"\d{3,}[\d,]* (sizes|products|options|variants|skus|combinations|models|items)|\d{1,3}(,\d{3})+ (sizes|products|options|variants|skus|combinations)", 2, "the range is too large to browse"],
         [r"compar\w*|confus\w*|overwhelm\w*|too many (products|options|choices)|shortlist\w*|filter\w*", 1, "the range is hard to compare"],
         [r"suit(s|able)?|match(es|ing)?|compatib\w*|goes? with|fits? (their|the)", 1, "products must suit the customer's situation"],
         [r"returns?\b|wrong (product|size|one)", 1, "customers buy the wrong product and return it"],
     ]},
    {"id": "plan", "name": "Plan & Calculate", "module": "plan", "prefix": "PC",
     "summary": "Work things out from the customer's situation: sizes, quantities, layouts, costs.",
     "patterns": [
         [r"plan(ner|ning)?\b|layout|floor ?plans?|room planner|space planning", 2, "customers plan a space or project"],
         [r"calculat\w*|work out|how (many|much)|estimat\w* (the )?(size|quantity|amount|cost|energy)|sizing tool", 2, "something has to be calculated"],
         [r"roi|return on investment|payback|savings calculator|running costs?|total cost", 2, "customers need to see costs or savings worked out"],
         [r"room|dimensions?|measure\w*|distance|area|square (metres|meters|feet)|width|height|depth", 1, "it depends on room sizes or measurements"],
         [r"quantit\w*|coverage|capacity|allowance|load|budget\w*", 1, "quantities, budgets or allowances need working out"],
     ]},
    {"id": "quote", "name": "Quote & Convert", "module": "quote", "prefix": "QC",
     "summary": "Turn a specification into a quote, proposal or order, with approvals and follow-up.",
     "patterns": [
         [r"quot(e|es|ing|ation)|proposals?|tenders?|rfqs?|cpq|price (list|book)s? for trade", 2, "customers need a quote rather than a fixed price"],
         [r"trade (price|pricing|account|customers?)s?|b2b|dealers?|resellers?|wholesale|bulk|distributors?", 2, "trade or business customers buy differently"],
         [r"deposit|invoice\w*|payment links?|purchase orders?|\bpos?\b|order forms?|contracts?|e-?sign\w*|sign[- ]off", 1, "there are order, payment or sign-off steps"],
         [r"price on request|custom pricing|negotiat\w*|discount\w*|margin", 1, "prices vary per customer or order"],
         [r"leads?|enquir\w*|inquir\w*|follow[- ]?ups?|convert\w*|sales pipeline|close (the |more )?(sale|deal)s?", 1, "enquiries need turning into orders"],
     ]},
    {"id": "connect", "name": "Connect & Automate", "module": "connect", "prefix": "CA",
     "summary": "Link systems and remove manual work: stock, prices, orders, notifications, reporting.",
     "patterns": [
         [r"integrat\w*|sync\w*|apis?|erp|pim|crm|xero|sage|netsuite|zapier|hubspot|salesforce|edi", 2, "several systems need to share data"],
         [r"manual(ly)?|re-?key\w*|copy and paste|spreadsheets?|by hand|double entry", 2, "information is moved by hand today"],
         [r"back ?-?end|back[- ]office|admin (panel|system|area|dashboard|portal)|portal|dashboards?|control panel", 2, "a back-office system or dashboard is needed"],
         [r"kpis?|key performance|metrics|reporting|reports?|analytics|track(ing)? (performance|sales|orders|leads|kpis?)|keep track|monitor\w*|insights?", 2, "performance needs tracking and reporting"],
         [r"automat\w*|workflows?|notif\w*|alerts?|reminders?|triggers?", 1, "steps should happen automatically"],
         [r"stock levels?|inventory|warehouse|fulfil+ment|price (file|list|updates?)|feeds?|database|single source|logins?|accounts?|permissions?", 1, "stock, prices or accounts are managed in systems"],
     ]},
    {"id": "audit", "name": "Audit & Improve", "module": "audit", "prefix": "AI",
     "summary": "Find and fix what stops people using or buying: accessibility, speed, conversion.",
     "patterns": [
         [r"accessib\w*|wcag|screen readers?|disab\w*|compliance|regulat\w*|european accessibility act|ada\b", 2, "accessibility or compliance matters"],
         [r"audit\w*|review (our|the) (site|website|shop|store)|health check|ux review|usability test\w*", 2, "the current site needs reviewing"],
         [r"conversion|drop[- ]?offs?|abandon\w*|bounce|nobody buys|low sales|not converting", 2, "people leave before buying"],
         [r"slow|speed|performance|seo|mobile|usability|broken|optimi[sz]\w*|a/?b test\w*|heat ?maps?", 1, "the site has performance or usability problems"],
         [r"kpis?|metrics|analytics|measure (success|performance|results)", 1, "results need measuring so they can be improved"],
     ]},
    {"id": "custom", "name": "Custom tool", "module": "custom", "prefix": "CT",
     "summary": "Something that doesn't fit the categories above.", "patterns": []},
]


# Not tools: things in the description that change scope for whichever tools are chosen.
SIGNALS = [
    [r"dealers?|resellers?|distributors?|partners?|retailers?", "Dealers or partners will use it", "Decide whether each dealer gets their own branded version, pricing and login, and who maintains their copy."],
    [r"reps?\b|sales (reps?|team|staff|people)|field sales", "Sales reps will use it", "Reps may need a staff mode: trade prices, saved customers and quotes they can send."],
    [r"in the field|on[- ]site|on sites|site visits?|at the customer'?s|showroom|in store|trade shows?", "It will be used away from a desk", "Plan for phones and tablets, poor signal (working offline) and sharing results on the spot."],
    [r"share|shared|embed\w*|white[- ]label\w*|on (their|dealers'?) (sites?|websites?)", "It will be shared or embedded elsewhere", "Plan for embedding on other websites, white-label styling and keeping every copy up to date."],
    [r"offline|no signal|poor signal|without (internet|wi-?fi)", "It must work offline", "Offline use changes how data is stored and synced; it needs designing in from the start."],
    [r"languages?|translat\w*|countries|international|export", "More than one market", "Plan for languages, currencies and regional pricing or availability."],
]


def o(id, label, **k):
    d = {"id": id, "label": label}
    d.update(k)
    return d


def q(id, type, label, affects, summary, **k):
    d = {"id": id, "type": type, "label": label, "affects": affects, "summary": summary}
    d.update(k)
    return d


USERS = lambda p: q(f"{p}-A01", "multi", "Who will use it?", ["purpose", "journey"], "Used by {value}.", required=True, options=[
    o("shoppers", "customers shopping online"), o("staff", "sales staff, in store or on calls"),
    o("trade", "trade customers or dealers"), o("admin", "your own admin team"), o("other", "someone else", other=True)])
PROTO = lambda p, rec: q(f"{p}-Z01", "textarea", "What must the first working prototype prove?", ["prototype", "acceptance"],
                          "The prototype must prove: {value}", required=True, recommend=rec)
DATE = lambda p: q(f"{p}-Z02", "text", "Is there a date driving this?", ["prototype", "production"], "Driven by: {value}.",
                   hint="A launch, season, trade show or compliance deadline.")
QUOTE_IMPLIES = [{"category": "quote", "reason": "The result has to become a quote."}]
CONNECT_IMPLIES = [{"category": "connect", "reason": "Data has to move between systems."}]
SELECT_IMPLIES = [{"category": "select", "reason": "Customers need help choosing products."}]
PLAN_IMPLIES = [{"category": "plan", "reason": "Something has to be worked out from the customer's measurements."}]

INTAKES = {
    "configure": {"name": "Configure & Visualise", "sections": [
        {"id": "A", "title": "Purpose and product", "intro": "What customers configure and why.", "questions": [
            USERS("CV"),
            q("CV-A02", "textarea", "What will customers configure?", ["purpose", "inputs"], "Customers configure: {value}",
              required=True, hint="For example: a media cabinet in three widths, with a choice of finishes and handles."),
            q("CV-A03", "multi", "Which things can they change?", ["inputs", "rules"], "They can change {value}.", required=True, options=[
                o("size", "size or dimensions", implies=PLAN_IMPLIES), o("materials", "materials or finishes"), o("colours", "colours"),
                o("components", "components or modules"), o("addons", "add-ons and accessories"),
                o("personal", "text, logos or engraving"), o("layout", "layout or arrangement")]),
            q("CV-A04", "single", "Do some choices rule out others?", ["rules", "exceptions"], "Incompatible choices: {value}.",
              options=[o("yes", "yes, some combinations can't be made"), o("no", "no, everything works together")]),
        ]},
        {"id": "B", "title": "Visuals, pricing and finish", "intro": "How it looks and what happens at the end.", "questions": [
            q("CV-B01", "single", "How should the product be shown?", ["outputs", "production"], "Shown as {value}.",
              recommend="Start with photos or renders per choice; move to real-time 3D if the range justifies it.", options=[
                o("3d", "real-time 3D the customer can rotate"), o("renders", "photo-real images that change with each choice"),
                o("2d", "a layered 2D illustration")]),
            q("CV-B02", "single", "Do 3D models of the product exist?", ["inputs", "production"], "3D models: {value}.", options=[
                o("mesh", "yes, as 3D files"), o("cad", "yes, as CAD files"), o("photos", "no, photos only"), o("none", "no, nothing yet")]),
            q("CV-B03", "single", "How should pricing work?", ["rules", "outputs"], "Pricing: {value}.", required=True, options=[
                o("live", "the price updates as they choose"), o("end", "the price shows at the end"),
                o("quote", "no prices; they request a quote", implies=QUOTE_IMPLIES)]),
            q("CV-B04", "multi", "What happens when they finish?", ["outputs", "acceptance"], "When finished: {value}.", required=True, options=[
                o("cart", "add to basket"), o("quote", "request a quote", implies=QUOTE_IMPLIES), o("share", "save and share a link"),
                o("pdf", "download a spec sheet"), o("ar", "see it in their room (AR)")]),
        ]},
        {"id": "Z", "title": "Scope", "intro": "What the first prototype proves.", "questions": [
            PROTO("CV", "Every option, rule and price for one product, with supplied photos or an illustration."), DATE("CV")]},
    ]},
    "plan": {"name": "Plan & Calculate", "sections": [
        {"id": "A", "title": "Purpose and inputs", "intro": "What's being planned and from what.", "questions": [
            USERS("PC"),
            q("PC-A02", "textarea", "What are they planning or working out?", ["purpose"], "They're working out: {value}", required=True,
              hint="For example: the right screen size for their room, or how much flooring to order."),
            q("PC-A03", "multi", "What will they enter?", ["inputs", "journey"], "They enter {value}.", required=True, options=[
                o("dims", "room or object dimensions"), o("qty", "quantities or people"), o("usage", "how they'll use it"),
                o("location", "location or postcode"), o("existing", "equipment they already own"), o("budget", "a budget")]),
            q("PC-A04", "single", "Where do the formulas come from?", ["rules", "inputs"], "Formulas come from {value}.",
              recommend="Your own rules of thumb first; we'll check them against manufacturer data.", options=[
                o("own", "our own rules of thumb"), o("standard", "an industry standard"), o("supplier", "supplier or manufacturer data")]),
        ]},
        {"id": "B", "title": "Results", "intro": "What the tool gives back and where it goes next.", "questions": [
            q("PC-B01", "multi", "What should it produce?", ["outputs"], "It produces {value}.", required=True, options=[
                o("numbers", "numbers with a short explanation"), o("drawing", "a drawing or layout"),
                o("products", "a list of suitable products", implies=SELECT_IMPLIES), o("plan", "a saved plan"), o("pdf", "a PDF")]),
            q("PC-B02", "multi", "Where should the result go next?", ["outputs", "journey"], "Results go to {value}.", options=[
                o("selector", "a product selector", implies=SELECT_IMPLIES), o("quote", "a quote", implies=QUOTE_IMPLIES),
                o("basket", "the basket"), o("staff", "your team")]),
            q("PC-B03", "single", "What if their inputs don't make sense?", ["exceptions", "acceptance"], "Odd inputs: {value}.",
              recommend="Warn with the likely mistake and let them correct it; never block silently.", options=[
                o("warn", "warn and let them correct it"), o("staff", "pass to your team"), o("block", "stop and explain")]),
        ]},
        {"id": "Z", "title": "Scope", "intro": "What the first prototype proves.", "questions": [
            PROTO("PC", "The calculation for your most common case, checked against three worked examples you supply."), DATE("PC")]},
    ]},
    "quote": {"name": "Quote & Convert", "sections": [
        {"id": "A", "title": "What's quoted", "intro": "Who asks for quotes and what goes into them.", "questions": [
            USERS("QC"),
            q("QC-A02", "textarea", "What do you quote for?", ["purpose", "inputs"], "Quotes cover: {value}", required=True),
            q("QC-A03", "single", "How is the price worked out?", ["rules", "inputs"], "Prices come from {value}.", required=True, options=[
                o("list", "a price list"), o("formula", "a formula or rate card"), o("costing", "costing each job"),
                o("manual", "staff setting the price by hand")]),
            q("QC-A04", "single", "Does anyone approve a quote before it's sent?", ["rules", "exceptions"], "Approval: {value}.", options=[
                o("no", "not needed"), o("some", "needed above a value or discount"), o("all", "needed for every quote")]),
        ]},
        {"id": "B", "title": "Output and follow-up", "intro": "What the customer receives and what happens next.", "questions": [
            q("QC-B01", "multi", "What should the customer receive?", ["outputs", "acceptance"], "Customers receive {value}.", required=True, options=[
                o("pdf", "a PDF quote"), o("email", "an email"), o("accept", "a link to accept online"),
                o("deposit", "a deposit payment link"), o("crm", "a record in your CRM", implies=CONNECT_IMPLIES)]),
            q("QC-B02", "text", "How long is a quote valid?", ["rules"], "Quotes are valid for {value}."),
            q("QC-B03", "multi", "What follow-up should happen?", ["outputs", "production"], "Follow-up: {value}.", options=[
                o("remind", "reminders to the customer"), o("alert", "alerts to your team"), o("expire", "expiry notices"),
                o("none", "none", exclusive=True)]),
        ]},
        {"id": "Z", "title": "Scope", "intro": "What the first prototype proves.", "questions": [
            PROTO("QC", "A correct quote for your three most common jobs, produced in under a minute."), DATE("QC")]},
    ]},
    "connect": {"name": "Connect & Automate", "sections": [
        {"id": "A", "title": "Today's manual work", "intro": "What's done by hand and between which systems.", "questions": [
            q("CA-A01", "textarea", "What do people re-key or copy by hand today?", ["purpose", "inputs"], "Done by hand today: {value}", required=True),
            q("CA-A02", "multi", "Which systems are involved?", ["inputs", "production"], "Systems: {value}.", required=True, options=[
                o("shop", "the online shop"), o("erp", "an ERP"), o("pim", "a PIM"), o("crm", "a CRM"), o("accounts", "accounting software"),
                o("sheet", "spreadsheets"), o("email", "email"), o("supplier", "a supplier feed"), o("other", "something else", other=True)]),
            q("CA-A03", "single", "Which way does data need to flow?", ["rules"], "Data flows {value}.", options=[
                o("one", "one way"), o("two", "both ways")]),
            q("CA-A04", "single", "How fresh does it need to be?", ["rules", "production"], "Updates {value}.",
              recommend="Hourly is usually enough; real time only where stock is scarce.", options=[
                o("realtime", "in real time"), o("hourly", "hourly"), o("daily", "daily"), o("demand", "when someone asks")]),
        ]},
        {"id": "B", "title": "Failures and people", "intro": "What happens when something goes wrong.", "questions": [
            q("CA-B01", "text", "Who should hear about it when a sync fails?", ["exceptions", "admin"], "Failures go to {value}."),
            q("CA-B02", "single", "Do staff need a portal to review or approve anything?", ["admin", "outputs"], "Staff portal: {value}.", options=[
                o("yes", "yes"), o("no", "no")]),
            q("CA-B03", "single", "Roughly how many records change a day?", ["production"], "About {value} changes a day.", options=[
                o("lt100", "under 100"), o("100-1k", "100 to 1,000"), o("1k+", "more than 1,000")]),
        ]},
        {"id": "Z", "title": "Scope", "intro": "What the first prototype proves.", "questions": [
            PROTO("CA", "One end-to-end sync for one record type, with failures reported."), DATE("CA")]},
    ]},
    "audit": {"name": "Audit & Improve", "sections": [
        {"id": "A", "title": "The site and the worry", "intro": "What we're looking at and why.", "questions": [
            q("AI-A01", "text", "Which site or pages?", ["purpose", "inputs"], "Site: {value}.", required=True, hint="A web address, or the journeys that matter most."),
            q("AI-A02", "multi", "What worries you?", ["purpose", "acceptance"], "Concerns: {value}.", required=True, options=[
                o("a11y", "accessibility or compliance"), o("conversion", "people leaving before buying"), o("speed", "speed"),
                o("mobile", "mobile experience"), o("search", "search visibility"),
                o("choice", "customers struggling to choose products", implies=SELECT_IMPLIES)]),
            q("AI-A03", "text", "Is there a deadline, such as a regulator's date?", ["prototype", "production"], "Deadline: {value}."),
        ]},
        {"id": "B", "title": "Fixing it", "intro": "Who fixes what, and how much.", "questions": [
            q("AI-B01", "single", "Who will make the fixes?", ["production", "admin"], "Fixes by {value}.", options=[
                o("bpc", "Blueprint Code"), o("team", "your own team"), o("agency", "another agency")]),
            q("AI-B02", "single", "How much of the site?", ["prototype", "production"], "Scope: {value}.",
              recommend="Your three most important journeys first, then the rest.", options=[
                o("key", "the most important journeys"), o("pages", "specific pages"), o("all", "the whole site")]),
            q("AI-B03", "single", "Where does it run?", ["production"], "Runs on {value}.", options=[
                o("woocommerce", "WooCommerce"), o("shopify", "Shopify"), o("custom", "a custom build"), o("other", "something else", other=True)]),
        ]},
        {"id": "Z", "title": "Scope", "intro": "What the first deliverable is.", "questions": [
            PROTO("AI", "A scored audit of your key journeys with the ten most important fixes."), DATE("AI")]},
    ]},
    "custom": {"name": "Custom tool", "sections": [
        {"id": "A", "title": "The idea", "intro": "Describe it in your own words.", "questions": [
            USERS("CT"),
            q("CT-A02", "textarea", "What problem does it solve?", ["purpose"], "It solves: {value}", required=True),
            q("CT-A03", "textarea", "What goes in?", ["inputs"], "Inputs: {value}", hint="What people enter, choose or upload."),
            q("CT-A04", "textarea", "What comes out?", ["outputs"], "Outputs: {value}", required=True),
            q("CT-A05", "textarea", "What rules should it follow?", ["rules"], "Rules: {value}"),
            q("CT-A06", "textarea", "Where does the information come from?", ["inputs", "production"], "Data comes from {value}"),
        ]},
        {"id": "Z", "title": "Scope", "intro": "What the first prototype proves.", "questions": [
            PROTO("CT", "We'll agree this with you at scoping."), DATE("CT")]},
    ]},
}

# The Connecting Tools questionnaire: how several tools behave as one journey.
# Tool-specific parts (the map, what passes, who owns each decision) live in the journey editor.
CX_DOCS = [{"id": "connections", "title": "Tool Map and Connections"}]
C = ["connections"]
CONNECT_TOOLS = {"module": {"id": "connect_tools", "name": "Connecting Tools", "schema": "bpc.discovery/1", "depth": "full",
    "intro": "These questions cover the journey as a whole. The map, what passes between tools and who owns each decision are set in the journey editor."},
  "documents": CX_DOCS, "rule_templates": {},
  "sections": [
    {"id": "A", "title": "Moving between tools", "intro": "Order, progress and shared records.", "questions": [
        q("CX-A01", "single", "Can someone start with any of the tools?", C, "Starting point: {value}.", required=True, options=[
            o("any", "any tool"), o("first", "only the first tool"), o("some", "some tools, not all")]),
        q("CX-A02", "single", "Can they move back and forth without losing their work?", C, "Moving back and forth: {value}.", required=True,
          recommend="Yes, keeping everything; later results update when an earlier answer changes.", options=[
            o("keep", "yes, everything is kept"), o("reset", "yes, but later results reset"), o("no", "no, it's one way")]),
        q("CX-A03", "single", "When an earlier answer changes, what should happen to later results?", C, "When an earlier answer changes: {value}.", required=True,
          recommend="Recalculate automatically and show the customer what changed.", options=[
            o("show", "recalculate and show what changed"), o("silent", "recalculate quietly"), o("clear", "clear later results and ask again"),
            o("per", "it depends on the connection (set in the journey editor)")]),
        q("CX-A04", "multi", "What is shared across the tools?", C, "Shared across tools: {value}.", options=[
            o("project", "one saved project"), o("account", "a customer account"), o("basket", "one basket", ), o("quote", "one quote", implies=QUOTE_IMPLIES),
            o("none", "nothing; each tool stands alone", exclusive=True)]),
    ]},
    {"id": "B", "title": "Conflicts and the finish", "intro": "Disagreements, staff and where it all ends.", "questions": [
        q("CX-B01", "single", "When two tools produce choices that don't work together, what should happen?", C, "Conflicts: {value}.", required=True,
          hint="For example, the planner recommends a 120-inch screen but the chosen projector can't fill it.",
          recommend="Explain the conflict and let the customer choose which to change.", options=[
            o("earlier", "the earlier tool wins; later tools adapt"), o("later", "the later tool wins, with a warning"),
            o("ask", "explain it and let the customer choose"), o("staff", "pass it to staff")]),
        q("CX-B02", "single", "Can staff review or override a result?", C, "Staff overrides: {value}.", options=[
            o("recorded", "yes, and every override is recorded"), o("yes", "yes"), o("no", "no")]),
        q("CX-B03", "single", "Where does the combined journey end?", C, "The journey ends with {value}.", required=True, options=[
            o("plan", "a saved plan"), o("brief", "an emailed brief"), o("catalogue", "a curated catalogue"), o("quote", "a quote request", implies=QUOTE_IMPLIES),
            o("basket", "a basket"), o("checkout", "checkout"), o("staff", "a handoff to staff"), o("appointment", "an appointment")]),
        q("CX-B04", "multi", "Which systems receive the combined result?", C, "The result goes to {value}.", options=[
            o("shop", "the online shop"), o("crm", "a CRM", implies=CONNECT_IMPLIES), o("erp", "an ERP", implies=CONNECT_IMPLIES),
            o("email", "email to your team"), o("none", "none", exclusive=True)]),
    ]},
    {"id": "Z", "title": "Scope", "intro": "What the first combined prototype proves.", "questions": [
        q("CX-Z01", "textarea", "What must a prototype of the combined journey prove?", C, "The combined prototype must prove: {value}", required=True,
          recommend="The whole journey on sample data, including one earlier change that recalculates everything after it."),
    ]},
  ],
  "example": {"answers": {
      "CX-A01": {"value": "some"}, "CX-A02": {"value": "keep"}, "CX-A03": {"value": "show"}, "CX-A04": {"value": ["project", "basket"]},
      "CX-B01": {"status": "bpc_accepted"}, "CX-B02": {"value": "recorded"}, "CX-B03": {"value": "basket"}, "CX-B04": {"value": ["shop", "email"]}}},
}

# Answers in the hand-authored Select & Recommend module that suggest other tools.
SR_IMPLIES = {
    ("SR-A04", "quote"): QUOTE_IMPLIES,
    ("SR-D05", "trade"): [{"category": "quote", "reason": "Trade customers get prices on request."}],
    ("SR-D05", "quote"): QUOTE_IMPLIES,
    ("SR-E01", "custom"): [{"category": "quote", "reason": "Custom orders are handled by quote."}],
    ("SR-C04", "size"): [{"category": "plan", "reason": "Sizes depend on the customer's measurements."}],
    ("SR-C04", "compat"): [{"category": "configure", "reason": "Products must be combined compatibly."}],
    ("SR-C01", "erp"): CONNECT_IMPLIES, ("SR-C01", "pim"): CONNECT_IMPLIES, ("SR-C01", "api"): CONNECT_IMPLIES,
    ("SR-C06", "daily"): [{"category": "connect", "reason": "Product data changes daily."}],
}


def main():
    cats = [{k: v for k, v in c.items()} for c in CATEGORIES]
    for c in cats:
        c["patterns"] = [{"re": p, "weight": w, "reason": r} for p, w, r in c["patterns"]]
    sig = [{"re": r, "title": t, "note": n} for r, t, n in SIGNALS]
    (HERE / "categories.json").write_text(json.dumps({"categories": cats, "signals": sig}, indent=1), encoding="utf-8")
    for cid, spec in INTAKES.items():
        cat = next(c for c in CATEGORIES if c["id"] == cid)
        cfg = {"module": {"id": cid, "name": spec["name"], "schema": "bpc.discovery/1", "depth": "intake",
                          "intro": "A short guided intake. We'll go deeper at the scoping call. If you're not sure, choose I don't know or Ask BPC to advise."},
               "documents": DOCUMENTS, "rule_templates": {}, "sections": spec["sections"]}
        (HERE / f"{cat['module']}.json").write_text(json.dumps(cfg, indent=1), encoding="utf-8")
    (HERE / "connect_tools.json").write_text(json.dumps(CONNECT_TOOLS, indent=1), encoding="utf-8")
    sr_path = HERE / "select_recommend.json"
    sr = json.loads(sr_path.read_text(encoding="utf-8"))
    sr["module"]["depth"] = "full"
    for s in sr["sections"]:
        for qq in s["questions"]:
            for op in qq.get("options", []):
                key = (qq["id"], op["id"])
                if key in SR_IMPLIES:
                    op["implies"] = SR_IMPLIES[key]
    sr_path.write_text(json.dumps(sr, indent=1), encoding="utf-8")
    print(f"Wrote categories.json ({len(cats)} categories), {len(INTAKES)} intake modules and connect_tools.json; added {len(SR_IMPLIES)} implies links to select_recommend.json")


if __name__ == "__main__":
    main()
