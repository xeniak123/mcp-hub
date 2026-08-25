import type { ConnectorManifest } from '@hub/shared';
import { loadCustomManifests } from './custom.js';
import { loadCachedCommunityManifests } from './community.js';
import { github } from './connectors/github.js';
import { postgres } from './connectors/postgres.js';
import { slack } from './connectors/slack.js';
import { filesystem } from './connectors/filesystem.js';
import { fetchConnector } from './connectors/fetch.js';
import { memory } from './connectors/memory.js';
import { sequentialThinking } from './connectors/sequential-thinking.js';
import { braveSearch } from './connectors/brave-search.js';
import { puppeteer } from './connectors/puppeteer.js';
import { jira } from './connectors/jira.js';
import { linear } from './connectors/linear.js';
import { notion } from './connectors/notion.js';
import { stripe } from './connectors/stripe.js';
import { sentry } from './connectors/sentry.js';
import { figma } from './connectors/figma.js';
import { googleDrive } from './connectors/google-drive.js';
import { googleMaps } from './connectors/google-maps.js';
import { gitlab } from './connectors/gitlab.js';
import { sqlite } from './connectors/sqlite.js';
import { everart } from './connectors/everart.js';
import { pandoc } from './connectors/pandoc.js';
import { kagi } from './connectors/kagi.js';
import { docker } from './connectors/docker.js';
import { todoist } from './connectors/todoist.js';
import { discord } from './connectors/discord.js';
import { s3 } from './connectors/s3.js';
import { supabase } from './connectors/supabase.js';
import { redis } from './connectors/redis.js';
import { mongodb } from './connectors/mongodb.js';
import { elasticsearch } from './connectors/elasticsearch.js';
import { mysql } from './connectors/mysql.js';
import { homeAssistant } from './connectors/home-assistant.js';
import { youtube } from './connectors/youtube.js';
import { git } from './connectors/git.js';
import { hackerNews } from './connectors/hacker-news.js';
import { arxiv } from './connectors/arxiv.js';
import { telegram } from './connectors/telegram.js';
import { wikipedia } from './connectors/wikipedia.js';
import { trello } from './connectors/trello.js';
import { asana } from './connectors/asana.js';
import { airtable } from './connectors/airtable.js';
import { confluence } from './connectors/confluence.js';
import { dropbox } from './connectors/dropbox.js';
import { shopify } from './connectors/shopify.js';
import { hubspot } from './connectors/hubspot.js';
import { kubernetes } from './connectors/kubernetes.js';
import { cloudflare } from './connectors/cloudflare.js';
import { obsidian } from './connectors/obsidian.js';
import { excalidraw } from './connectors/excalidraw.js';
import { blender } from './connectors/blender.js';
import { time as timeConnector } from './connectors/time.js';
import { googleCalendar } from './connectors/google-calendar.js';
import { reddit } from './connectors/reddit.js';
import { clickup } from './connectors/clickup.js';
import { bigquery } from './connectors/bigquery.js';
import { tavily } from './connectors/tavily.js';
import { ms365 } from './connectors/ms-365.js';
import { salesforce } from './connectors/salesforce.js';
import { quickbooks } from './connectors/quickbooks.js';
import { xero } from './connectors/xero.js';
import { zendesk } from './connectors/zendesk.js';
import { freshdesk } from './connectors/freshdesk.js';
import { servicenow } from './connectors/servicenow.js';
import { twilio } from './connectors/twilio.js';
import { email } from './connectors/email.js';
import { odoo } from './connectors/odoo.js';
import { pipedrive } from './connectors/pipedrive.js';
import { bitbucket } from './connectors/bitbucket.js';
import { dynatrace } from './connectors/dynatrace.js';
import { googleSheets } from './connectors/google-sheets.js';
import { dataverse } from './connectors/dataverse.js';

export const REGISTRY: ConnectorManifest[] = [
  github,
  postgres,
  slack,
  filesystem,
  fetchConnector,
  memory,
  sequentialThinking,
  braveSearch,
  puppeteer,
  jira,
  linear,
  notion,
  stripe,
  sentry,
  figma,
  googleDrive,
  googleMaps,
  gitlab,
  sqlite,
  everart,
  pandoc,
  kagi,
  docker,
  todoist,
  discord,
  s3,
  supabase,
  redis,
  mongodb,
  elasticsearch,
  mysql,
  homeAssistant,
  youtube,
  git,
  hackerNews,
  arxiv,
  telegram,
  wikipedia,
  trello,
  asana,
  airtable,
  confluence,
  dropbox,
  shopify,
  hubspot,
  kubernetes,
  cloudflare,
  obsidian,
  excalidraw,
  blender,
  timeConnector,
  googleCalendar,
  reddit,
  clickup,
  bigquery,
  tavily,
  ms365,
  salesforce,
  quickbooks,
  xero,
  zendesk,
  freshdesk,
  servicenow,
  twilio,
  email,
  odoo,
  pipedrive,
  bitbucket,
  dynatrace,
  googleSheets,
  dataverse,
];

// Custom manifests from the connectors volume are appended after built-ins;
// a custom id that collides with a built-in is ignored (built-ins win).
// Community-repo manifests are namespaced (`community:owner/repo/<id>`) so
// they cannot collide at all; they load from cache so they survive offline.
const byId = new Map<string, ConnectorManifest>();
for (const m of REGISTRY) byId.set(m.id, m);
for (const m of [...loadCustomManifests(), ...loadCachedCommunityManifests()]) {
  if (byId.has(m.id)) {
    console.warn(`[registry] custom manifest "${m.id}" ignored — collides with a built-in`);
    continue;
  }
  REGISTRY.push(m);
  byId.set(m.id, m);
}

export function getManifest(id: string): ConnectorManifest | undefined {
  return byId.get(id);
}
