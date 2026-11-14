import { app } from 'electron';
import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import type { Settings, DayCounts, OverrideEvent } from '../shared/types';
import { DEFAULT_SETTINGS, emptyCounts, todayKey } from '../shared/defaults';

interface StoreShape {
  settings: Settings;
  days: Record<string, DayCounts>;
  overrides: OverrideEvent[];
}

const FILE = 'desk-reset.json';

export class Store {
  private path: string;
  private data: StoreShape;

  private constructor(path: string, data: StoreShape) {
    this.path = path;
    this.data = data;
  }

  static async open(): Promise<Store> {
    const path = join(app.getPath('userData'), FILE);
    let data: StoreShape;
    try {
      const raw = await fs.readFile(path, 'utf8');
      const parsed = JSON.parse(raw) as Partial<StoreShape>;
      data = {
        settings: {
          ...DEFAULT_SETTINGS,
          ...(parsed.settings ?? {}),
          // Deep-merge nested records so new keys (e.g. water) added in
          // later versions don't read as undefined on existing installs.
          intervals: { ...DEFAULT_SETTINGS.intervals, ...(parsed.settings?.intervals ?? {}) },
          lengths:   { ...DEFAULT_SETTINGS.lengths,   ...(parsed.settings?.lengths ?? {}) },
          workingHours: { ...DEFAULT_SETTINGS.workingHours, ...(parsed.settings?.workingHours ?? {}) }
        },
        days: Object.fromEntries(
          Object.entries(parsed.days ?? {}).map(([date, d]) => [date, {
            ...emptyCounts(date),
            ...d,
            breaksTaken:   { ...emptyCounts(date).breaksTaken,   ...(d?.breaksTaken   ?? {}) },
            breaksSkipped: { ...emptyCounts(date).breaksSkipped, ...(d?.breaksSkipped ?? {}) }
          }])
        ),
        overrides: parsed.overrides ?? []
      };
    } catch {
      data = { settings: { ...DEFAULT_SETTINGS }, days: {}, overrides: [] };
    }
    const store = new Store(path, data);
    await store.save();
    return store;
  }

  get settings(): Settings {
    return this.data.settings;
  }

  async updateSettings(patch: Partial<Settings>): Promise<Settings> {
    this.data.settings = { ...this.data.settings, ...patch };
    await this.save();
    return this.data.settings;
  }

  today(): DayCounts {
    const key = todayKey();
    if (!this.data.days[key]) this.data.days[key] = emptyCounts(key);
    return this.data.days[key];
  }

  async bumpSip(): Promise<DayCounts> {
    this.today().sips += 1;
    await this.save();
    return this.today();
  }

  async recordBreak(kind: 'eye' | 'stretch' | 'long' | 'water', outcome: 'taken' | 'skipped'): Promise<void> {
    const t = this.today();
    if (outcome === 'taken') t.breaksTaken[kind] += 1;
    else t.breaksSkipped[kind] += 1;
    await this.save();
  }

  async recordSnooze(): Promise<void> {
    this.today().snoozesUsed += 1;
    await this.save();
  }

  async recordOverride(ev: OverrideEvent): Promise<void> {
    this.data.overrides.push(ev);
    if (this.data.overrides.length > 1000) {
      this.data.overrides = this.data.overrides.slice(-1000);
    }
    await this.save();
  }

  async exportJSON(): Promise<string> {
    return JSON.stringify(this.data, null, 2);
  }

  async deleteAll(): Promise<void> {
    this.data = { settings: { ...DEFAULT_SETTINGS }, days: {}, overrides: [] };
    await this.save();
  }

  private async save(): Promise<void> {
    const tmp = this.path + '.tmp';
    await fs.writeFile(tmp, JSON.stringify(this.data, null, 2), 'utf8');
    await fs.rename(tmp, this.path);
  }
}
