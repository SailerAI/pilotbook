import { createApp, ref, computed, onMounted, watch } from "vue";
import { marked } from "marked";

const GROUP_TYPES = {
  backlog: ["epic", "story", "task"],
  adr: ["adr"],
  rules: ["business-rule"],
  ideas: ["idea"],
};

const SKIP_FIELDS = new Set(["id", "type", "title", "created", "updated", "body"]);
const LAYOUT_KEY = "pilotbook.peekLayout";
const BODY_KEY = "pilotbook.bodyMode";
const UNPHASED = "Unphased";

function parentField(schema, type) {
  return schema?.types?.[type]?.parent;
}

function sortById(list) {
  return [...list].sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
}

function phaseKey(item) {
  const p = item.data?.phase;
  return p == null || p === "" ? UNPHASED : p;
}

function workTypesOf(schema) {
  const named = schema?.workTypes;
  if (Array.isArray(named) && named.length) return named;
  return Object.entries(schema?.types || {})
    .filter(([, cfg]) => cfg.numbers?.includes("phase"))
    .map(([name]) => name);
}

function findSwimlaneRoot(schema, byId, item) {
  let cur = item;
  const seen = new Set();
  while (cur && !seen.has(cur.id)) {
    seen.add(cur.id);
    const field = parentField(schema, cur.type);
    if (!field) return cur;
    const pid = cur.data[field];
    if (!pid) return cur;
    const parent = byId.get(pid);
    if (!parent) return cur;
    cur = parent;
  }
  return item;
}

function nestRows(schema, cellItems) {
  const ids = new Set(cellItems.map((i) => i.id));
  const tops = sortById(
    cellItems.filter((item) => {
      const field = parentField(schema, item.type);
      if (!field) return true;
      const pid = item.data[field];
      return !pid || !ids.has(pid);
    }),
  );
  const rows = [];
  const walk = (item, depth) => {
    rows.push({ item, depth });
    const kids = sortById(
      cellItems.filter((child) => {
        const field = parentField(schema, child.type);
        return field && child.data[field] === item.id;
      }),
    );
    for (const kid of kids) walk(kid, depth + 1);
  };
  for (const top of tops) walk(top, 0);
  return rows;
}

marked.setOptions({ gfm: true, breaks: false });

function escapeRe(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function itemIdRe(itemList) {
  const ids = [...new Set(itemList.map((i) => i.id).filter(Boolean))].sort(
    (a, b) => b.length - a.length,
  );
  if (!ids.length) return null;
  return new RegExp(`\\b(${ids.map(escapeRe).join("|")})\\b`, "g");
}

function autolinkHtml(html, itemList) {
  const re = itemIdRe(itemList);
  if (!re) return html;
  const skipRe = /^(<a\b[^>]*>[\s\S]*?<\/a>|<code\b[^>]*>[\s\S]*?<\/code>|<pre\b[^>]*>[\s\S]*?<\/pre>)/i;
  let out = "";
  let rest = String(html || "");
  while (rest) {
    const skip = skipRe.exec(rest);
    if (skip) {
      out += skip[0];
      rest = rest.slice(skip[0].length);
      continue;
    }
    const next = rest.search(/<(?:a|code|pre)\b/i);
    if (next === 0) {
      out += rest[0];
      rest = rest.slice(1);
      continue;
    }
    const chunk = next === -1 ? rest : rest.slice(0, next);
    re.lastIndex = 0;
    out += chunk.replace(re, (id) => `<a href="${id}">${id}</a>`);
    rest = next === -1 ? "" : rest.slice(next);
  }
  return out;
}

function dirnamePosix(rel) {
  const n = String(rel || "").replaceAll("\\", "/");
  const i = n.lastIndexOf("/");
  return i <= 0 ? "" : n.slice(0, i);
}

function normalizePosix(p) {
  const parts = [];
  for (const seg of String(p).replaceAll("\\", "/").split("/")) {
    if (!seg || seg === ".") continue;
    if (seg === "..") parts.pop();
    else parts.push(seg);
  }
  return parts.join("/");
}

function resolveHref(href, currentRel, itemList) {
  const raw = String(href || "").trim();
  if (!raw || /^(https?:|mailto:|javascript:)/i.test(raw)) return null;
  const pathOnly = raw.split("#")[0].split("?")[0];
  if (!pathOnly) return null;
  const re = itemIdRe(itemList);
  if (re) {
    re.lastIndex = 0;
    const m = pathOnly.match(re);
    if (m) {
      const hit = itemList.find((i) => i.id === m[0]);
      if (hit) return hit;
    }
  }
  const joined = pathOnly.startsWith("/")
    ? normalizePosix(pathOnly)
    : normalizePosix(`${dirnamePosix(currentRel)}/${pathOnly}`);
  if (!joined) return null;
  return (
    itemList.find((i) => i.rel === joined) ||
    itemList.find((i) => i.rel.endsWith(`/${joined}`)) ||
    itemList.find((i) => joined.endsWith(`/${i.rel}`)) ||
    null
  );
}

createApp({
  setup() {
    const items = ref([]);
    const schema = ref({ types: {} });
    const group = ref("backlog");
    const view = ref("kanban");
    const query = ref("");
    const searchHits = ref([]);
    const searchBusy = ref(false);
    const peekStatus = ref(null);
    const typeFilter = ref("all");
    const epicFilter = ref("all");
    const phaseFilter = ref("all");
    const priorityFilter = ref("all");
    const hideDone = ref(false);
    const editing = ref(null);
    const peekStack = ref([]);
    const form = ref({});
    const peekLayout = ref(localStorage.getItem(LAYOUT_KEY) || "side");
    const peekTab = ref("edit");
    const briefHtml = ref("");
    const selectedEdge = ref(null);
    const bodyMode = ref(localStorage.getItem(BODY_KEY) || "preview");
    const creating = ref(false);
    const create = ref({ type: "story", title: "", epic: "", story: "", goal: "" });
    const demandTitle = ref("");
    const intake = ref(null);
    const clarifyAnswers = ref({});
    const intakeBusy = ref(false);
    const saving = ref(false);
    const toast = ref("");
    const toastError = ref(false);
    const lint = ref({ errors: [], warnings: [], count: 0 });
    const dragId = ref(null);
    const dragOver = ref(null);
    const sortKey = ref("id");
    const sortDir = ref(1);

    const tabs = [
      { id: "backlog", label: "Backlog" },
      { id: "roadmap", label: "Roadmap" },
      { id: "adr", label: "ADRs" },
      { id: "rules", label: "Rules" },
      { id: "ideas", label: "Ideas" },
    ];

    function flash(message, isError = false) {
      toast.value = message;
      toastError.value = isError;
      setTimeout(() => {
        if (toast.value === message) toast.value = "";
      }, 2800);
    }

    async function api(path, opts) {
      const res = await fetch(path, {
        headers: { "Content-Type": "application/json" },
        ...opts,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || res.statusText);
      return data;
    }

    async function refresh() {
      const [bundle, sch, lintRes] = await Promise.all([
        api("/api/items"),
        api("/api/schema"),
        api("/api/lint"),
      ]);
      items.value = bundle.items;
      schema.value = sch;
      lint.value = lintRes;
      if (bundle.errors?.length) flash(bundle.errors[0], true);
    }

    const groupTypes = computed(() =>
      group.value === "roadmap" ? workTypesOf(schema.value) : (GROUP_TYPES[group.value] ?? []),
    );
    const epics = computed(() => items.value.filter((i) => i.type === "epic"));
    const stories = computed(() => items.value.filter((i) => i.type === "story"));
    const phases = computed(() => {
      const set = new Set(items.value.map((i) => i.data.phase).filter((p) => p != null));
      return [...set].sort((a, b) => a - b);
    });
    const columns = computed(() => {
      const types = typeFilter.value === "all" ? groupTypes.value : [typeFilter.value];
      const first = types[0];
      return schema.value.types?.[first]?.statuses ?? [];
    });

    const filtered = computed(() => {
      return items.value.filter((item) => {
        if (!groupTypes.value.includes(item.type)) return false;
        if (typeFilter.value !== "all" && item.type !== typeFilter.value) return false;
        if (epicFilter.value !== "all") {
          const inEpic =
            item.id === epicFilter.value ||
            item.data.epic === epicFilter.value ||
            stories.value.find((s) => s.id === item.data.story)?.data.epic === epicFilter.value;
          if (!inEpic) return false;
        }
        if (phaseFilter.value !== "all" && String(item.data.phase) !== phaseFilter.value) return false;
        if (priorityFilter.value !== "all" && item.data.priority !== priorityFilter.value) return false;
        if (hideDone.value && ["done", "cancelled"].includes(item.data.status)) return false;
        return true;
      });
    });

    const roadmapColumns = computed(() => [...phases.value, UNPHASED]);
    const roadmapLanes = computed(() => {
      const sch = schema.value;
      const byId = new Map(items.value.map((i) => [i.id, i]));
      const lanes = new Map();
      const unassigned = [];
      for (const item of filtered.value) {
        const root = findSwimlaneRoot(sch, byId, item);
        if (parentField(sch, root.type)) {
          unassigned.push(item);
          continue;
        }
        let lane = lanes.get(root.id);
        if (!lane) {
          lane = { root, items: [] };
          lanes.set(root.id, lane);
        }
        lane.items.push(item);
      }
      const out = [...lanes.values()].sort((a, b) =>
        String(a.root.id).localeCompare(String(b.root.id), undefined, { numeric: true }),
      );
      if (unassigned.length) out.push({ root: null, items: unassigned });
      return out;
    });

    function roadmapColLabel(col) {
      return col === UNPHASED ? UNPHASED : `Phase ${col}`;
    }
    function roadmapColCount(col) {
      return filtered.value.filter((i) => phaseKey(i) === col).length;
    }
    function roadmapCell(lane, col) {
      const sch = schema.value;
      const cellItems = lane.items.filter((item) => parentField(sch, item.type) && phaseKey(item) === col);
      return nestRows(sch, cellItems);
    }

    function byStatus(status) {
      return filtered.value
        .filter((i) => i.data.status === status)
        .sort((a, b) => String(a.id).localeCompare(String(b.id)));
    }

    const listed = computed(() => {
      const rows = [...filtered.value];
      const key = sortKey.value;
      rows.sort((a, b) => {
        const av = key === "title" ? a.data.title : key === "id" ? a.id : a.data[key];
        const bv = key === "title" ? b.data.title : key === "id" ? b.id : b.data[key];
        return String(av ?? "").localeCompare(String(bv ?? ""), undefined, { numeric: true }) * sortDir.value;
      });
      return rows;
    });

    const graphNodes = computed(() => {
      const list = filtered.value.slice(0, 48);
      const cols = 6;
      return list.map((item, i) => ({
        id: item.id,
        item,
        title: String(item.data.title || "").slice(0, 22),
        x: 20 + (i % cols) * 190,
        y: 20 + Math.floor(i / cols) * 70,
      }));
    });

    const graphEdges = computed(() => {
      const pos = new Map(graphNodes.value.map((n) => [n.id, n]));
      const edges = [];
      for (const n of graphNodes.value) {
        const refs = [n.item.data.epic, n.item.data.story, ...(n.item.data.depends_on || []), ...(n.item.data.business_rules || []), ...(n.item.data.adrs || [])].filter(Boolean);
        for (const ref of refs) {
          const t = pos.get(ref);
          if (!t) continue;
          edges.push({ x1: n.x + 80, y1: n.y + 22, x2: t.x + 80, y2: t.y + 22 });
        }
      }
      return edges;
    });

    function sortBy(key) {
      if (sortKey.value === key) sortDir.value *= -1;
      else {
        sortKey.value = key;
        sortDir.value = 1;
      }
    }

    const lintLabel = computed(() => {
      const { errors, warnings, count } = lint.value;
      if (errors?.length) return `${errors.length} lint error(s)`;
      if (warnings?.length) return `${count} files · ${warnings.length} warning(s)`;
      return `${count ?? items.value.length} files · lint ok`;
    });
    const lintClass = computed(() => (lint.value.errors?.length ? "bad" : "ok"));

    const editableFields = computed(() => {
      if (!editing.value) return [];
      const cfg = schema.value.types[editing.value.type];
      if (!cfg) return [];
      return cfg.required
        .filter((key) => !SKIP_FIELDS.has(key))
        .map((key) => ({
          key,
          enum: cfg.enums?.[key],
          number: cfg.numbers?.includes(key),
          array: cfg.arrays?.includes(key),
        }));
    });

    const renderedBody = computed(() => {
      const src = form.value.body || "";
      try {
        const html = String(marked.parse(src, { async: false }))
          .replaceAll(' disabled=""', "")
          .replaceAll(" disabled", "");
        return autolinkHtml(html, items.value);
      } catch {
        return "<p>Could not render markdown.</p>";
      }
    });

    const renderedBrief = computed(() => autolinkHtml(briefHtml.value, items.value));

    const parentItem = computed(() => {
      if (!editing.value) return null;
      const field = schema.value.types[editing.value.type]?.parent;
      if (!field) return null;
      const pid = editing.value.data[field];
      if (!pid) return null;
      return items.value.find((i) => i.id === pid) ?? null;
    });

    const childItems = computed(() => {
      if (!editing.value) return [];
      const id = editing.value.id;
      return items.value
        .filter((item) => {
          const field = schema.value.types[item.type]?.parent;
          return field && item.data[field] === id;
        })
        .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }));
    });

    function setLayout(layout) {
      peekLayout.value = layout;
    }

    function toggleTaskAt(index) {
      let n = 0;
      form.value.body = String(form.value.body || "").replace(
        /^(\s*[-*+]\s+)\[([ xX])\]/gm,
        (full, prefix, mark) => {
          if (n++ !== index) return full;
          const next = /\S/.test(mark) ? " " : "x";
          return `${prefix}[${next}]`;
        },
      );
    }

    function fieldRefs(field) {
      const raw = form.value[field.key];
      const ids = field.array
        ? String(raw || "")
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
        : raw
          ? [String(raw)]
          : [];
      return ids.map((id) => items.value.find((i) => i.id === id)).filter(Boolean);
    }

    function onMdClick(event) {
      const link = event.target.closest?.("a");
      if (link) {
        const href = link.getAttribute("href") || "";
        if (/^https?:/i.test(href) || href.startsWith("mailto:")) return;
        event.preventDefault();
        const item = resolveHref(href, editing.value?.rel, items.value);
        if (item) openItem(item);
        return;
      }
      const box =
        event.target.closest?.("input[type=checkbox]") ||
        event.target.closest?.("li")?.querySelector("input[type=checkbox]");
      if (!box) return;
      event.preventDefault();
      const boxes = [...event.currentTarget.querySelectorAll("input[type=checkbox]")];
      const idx = boxes.indexOf(box);
      if (idx >= 0) toggleTaskAt(idx);
    }

    let searchSeq = 0;
    let searchTimer = 0;
    let statusSeq = 0;

    watch(query, (raw) => {
      window.clearTimeout(searchTimer);
      const q = String(raw ?? "").trim();
      if (!q) {
        searchSeq += 1;
        searchHits.value = [];
        searchBusy.value = false;
        return;
      }
      searchBusy.value = true;
      searchTimer = window.setTimeout(async () => {
        const seq = ++searchSeq;
        try {
          const data = await api(`/api/search?q=${encodeURIComponent(q)}`);
          if (seq !== searchSeq) return;
          searchHits.value = Array.isArray(data.items) ? data.items : [];
        } catch (err) {
          if (seq !== searchSeq) return;
          searchHits.value = [];
          flash(err.message, true);
        } finally {
          if (seq === searchSeq) searchBusy.value = false;
        }
      }, 200);
    });

    async function loadStatus(id) {
      const seq = ++statusSeq;
      peekStatus.value = null;
      try {
        const data = await api(`/api/status/${encodeURIComponent(id)}`);
        if (seq !== statusSeq) return;
        peekStatus.value = {
          ...data,
          requires: Array.isArray(data.requires) ? data.requires : [],
          missingDeps: Array.isArray(data.missingDeps) ? data.missingDeps : [],
          unlocks: Array.isArray(data.unlocks) ? data.unlocks : [],
        };
      } catch (err) {
        if (seq !== statusSeq) return;
        peekStatus.value = { error: err.message, requires: [], missingDeps: [], unlocks: [] };
      }
    }

    function findItem(id) {
      return items.value.find((i) => i.id === id) ?? null;
    }

    function openById(id) {
      const item = findItem(id);
      if (item) openItem(item);
    }

    function openSearchHit(hit) {
      query.value = "";
      searchHits.value = [];
      openById(hit.id);
    }

    function openItem(item, opts = {}) {
      if (opts.push !== false && editing.value && editing.value.id !== item.id) {
        peekStack.value.push(editing.value.id);
      }
      editing.value = item;
      peekTab.value = "edit";
      const cfg = schema.value.types[item.type];
      const next = { title: item.data.title, body: item.body };
      for (const key of cfg?.required ?? []) {
        if (SKIP_FIELDS.has(key)) continue;
        const val = item.data[key];
        next[key] = cfg.arrays?.includes(key) && Array.isArray(val) ? val.join(", ") : val;
      }
      form.value = next;
      loadStatus(item.id);
    }

    function peekBack() {
      while (peekStack.value.length) {
        const id = peekStack.value.pop();
        const item = items.value.find((i) => i.id === id);
        if (item) {
          openItem(item, { push: false });
          return;
        }
      }
    }

    async function loadBrief() {
      if (!editing.value) return;
      peekTab.value = "brief";
      try {
        const data = await api(`/api/brief/${editing.value.id}`);
        briefHtml.value = String(marked.parse(data.markdown || "", { async: false }));
      } catch (err) {
        briefHtml.value = `<p>${err.message}</p>`;
      }
    }

    function closeEditor() {
      editing.value = null;
      peekStack.value = [];
      peekStatus.value = null;
      statusSeq += 1;
    }

    async function save() {
      if (!editing.value) return;
      saving.value = true;
      try {
        const cfg = schema.value.types[editing.value.type];
        const data = { title: form.value.title };
        for (const key of cfg.required) {
          if (SKIP_FIELDS.has(key)) continue;
          data[key] = form.value[key];
        }
        const updated = await api(`/api/items/${editing.value.id}`, {
          method: "PATCH",
          body: JSON.stringify({ data, body: form.value.body }),
        });
        flash(`Saved ${updated.id}`);
        await refresh();
        const fresh = items.value.find((i) => i.id === updated.id);
        if (fresh) openItem(fresh);
      } catch (err) {
        flash(err.message, true);
      } finally {
        saving.value = false;
      }
    }

    async function removeCurrent() {
      if (!editing.value) return;
      if (!confirm(`Delete ${editing.value.rel}? This cannot be undone.`)) return;
      try {
        await api(`/api/items/${editing.value.id}`, { method: "DELETE" });
        flash(`Deleted ${editing.value.id}`);
        editing.value = null;
        await refresh();
      } catch (err) {
        flash(err.message, true);
      }
    }

    function onDragStart(event, item) {
      dragId.value = item.id;
      event.dataTransfer.setData("text/plain", item.id);
      event.dataTransfer.effectAllowed = "move";
    }
    function onDragOver(event, col) {
      event.dataTransfer.dropEffect = "move";
      dragOver.value = col;
    }
    async function onDrop(event, status) {
      event.preventDefault();
      dragOver.value = null;
      const id = event.dataTransfer.getData("text/plain") || dragId.value;
      dragId.value = null;
      const item = items.value.find((i) => i.id === id);
      if (!item || item.data.status === status) return;
      try {
        await api(`/api/items/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ data: { status } }),
        });
        flash(`${id} → ${status}`);
        await refresh();
      } catch (err) {
        flash(err.message, true);
      }
    }

    function openCreate() {
      const defaultType = groupTypes.value[1] ?? groupTypes.value[0] ?? "story";
      create.value = {
        type: defaultType,
        title: "",
        epic: epics.value[0]?.id ?? "",
        story: stories.value[0]?.id ?? "",
        goal: "",
      };
      creating.value = true;
    }

    async function submitCreate() {
      try {
        const payload = { ...create.value };
        if (payload.type !== "story") delete payload.epic;
        if (payload.type !== "task") delete payload.story;
        if (payload.type !== "epic") delete payload.goal;
        const created = await api("/api/items", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        creating.value = false;
        flash(`Created ${created.id}`);
        await refresh();
        const fresh = items.value.find((i) => i.id === created.id);
        if (fresh) openItem(fresh);
      } catch (err) {
        flash(err.message, true);
      }
    }

    async function submitDemand() {
      const title = demandTitle.value.trim();
      if (!title) {
        flash("Enter a one-line demand", true);
        return;
      }
      intakeBusy.value = true;
      try {
        const data = await api("/api/intake", {
          method: "POST",
          body: JSON.stringify({ title }),
        });
        intake.value = data;
        const answers = {};
        for (const q of data.clarify?.questions ?? []) {
          answers[q.id] = { option: q.options?.[0]?.id ?? "open-question", text: "" };
        }
        clarifyAnswers.value = answers;
        demandTitle.value = "";
        if (data.clarify?.ready) {
          flash(`Created ${data.item.id} (ready)`);
          await refresh();
          const fresh = items.value.find((i) => i.id === data.item.id);
          if (fresh) openItem(fresh);
        }
      } catch (err) {
        flash(err.message, true);
      } finally {
        intakeBusy.value = false;
      }
    }

    function clearIntake() {
      intake.value = null;
      clarifyAnswers.value = {};
    }

    async function saveClarify() {
      if (!intake.value) return;
      const answers = (intake.value.clarify?.questions ?? []).map((q) => ({
        question: q.id,
        option: clarifyAnswers.value[q.id]?.option,
        text: clarifyAnswers.value[q.id]?.text,
      }));
      intakeBusy.value = true;
      try {
        await api(`/api/items/${intake.value.item.id}/clarify`, {
          method: "POST",
          body: JSON.stringify({ answers }),
        });
        flash(`Clarified ${intake.value.item.id}`);
        const id = intake.value.item.id;
        clearIntake();
        await refresh();
        const fresh = items.value.find((i) => i.id === id);
        if (fresh) openItem(fresh);
      } catch (err) {
        flash(err.message, true);
      } finally {
        intakeBusy.value = false;
      }
    }

    watch(group, () => {
      typeFilter.value = "all";
      if (group.value === "roadmap") phaseFilter.value = "all";
    });
    watch(peekLayout, (v) => localStorage.setItem(LAYOUT_KEY, v));
    watch(bodyMode, (v) => localStorage.setItem(BODY_KEY, v));

    onMounted(() => {
      window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          creating.value = false;
          closeEditor();
        }
        if ((e.metaKey || e.ctrlKey) && e.key === "s" && editing.value) {
          e.preventDefault();
          save();
        }
      });
      refresh().catch((err) => flash(err.message, true));
    });

    return {
      items,
      schema,
      group,
      view,
      query,
      searchHits,
      searchBusy,
      peekStatus,
      typeFilter,
      epicFilter,
      phaseFilter,
      priorityFilter,
      hideDone,
      editing,
      peekStack,
      form,
      peekLayout,
      peekTab,
      briefHtml,
      selectedEdge,
      bodyMode,
      renderedBody,
      renderedBrief,
      parentItem,
      childItems,
      creating,
      create,
      demandTitle,
      intake,
      clarifyAnswers,
      intakeBusy,
      saving,
      toast,
      toastError,
      tabs,
      groupTypes,
      epics,
      stories,
      phases,
      columns,
      filtered,
      listed,
      roadmapColumns,
      roadmapLanes,
      roadmapColLabel,
      roadmapColCount,
      roadmapCell,
      graphNodes,
      graphEdges,
      lintLabel,
      lintClass,
      editableFields,
      dragOver,
      byStatus,
      sortBy,
      refresh,
      openItem,
      openById,
      openSearchHit,
      findItem,
      peekBack,
      closeEditor,
      setLayout,
      loadBrief,
      onMdClick,
      fieldRefs,
      save,
      removeCurrent,
      onDragStart,
      onDragOver,
      onDrop,
      openCreate,
      submitCreate,
      submitDemand,
      clearIntake,
      saveClarify,
    };
  },
}).mount("#app");
