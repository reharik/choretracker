import type { Chore, ChoreCheck, ChoreExtra, ChoreWeeklySummary } from '@chore-tracker/contracts';
import React, { useCallback, useEffect, useState } from 'react';
import styled from 'styled-components';
import { useAuth } from '../contexts/AuthContext';
import { useChoreService } from '../hooks/useChoreService';
import { FormInput } from '../ui/FormInput';
import { Button, Card, HStack, VStack } from '../ui/Primitives';

// Extended types from weekly summary
type ChoreWithStats = Chore & { completions: number; earned: number };
type ExtraWithStats = ChoreExtra & { completions: number; earned: number };

// ── Helpers ──

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const FULL_DAYS = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

function getCurrentWeekKey(): string {
  const now = new Date();
  const year = now.getFullYear();

  // ISO week date: Week 1 is the week with the first Thursday
  const jan4 = new Date(year, 0, 4);
  const jan4Day = jan4.getDay() || 7; // Sunday = 7
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day + 1);

  // Calculate current week number
  const daysDiff = Math.floor((now.getTime() - week1Monday.getTime()) / 86400000);
  const weekNum = Math.floor(daysDiff / 7) + 1;

  return `${year}-W${String(weekNum).padStart(2, '0')}`;
}

function getWeekLabel(weekKey: string): string {
  // Parse weekKey (e.g., "2026-W07")
  const [year, weekStr] = weekKey.split('-W');
  const weekNum = parseInt(weekStr, 10);

  // ISO week date calculation: Week 1 is the week with the first Thursday of the year
  const jan4 = new Date(parseInt(year, 10), 0, 4);
  const jan4Day = jan4.getDay() || 7; // Sunday = 7
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day + 1);

  // Calculate Monday of the target week
  const mon = new Date(week1Monday);
  mon.setDate(week1Monday.getDate() + (weekNum - 1) * 7);

  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);

  const fmt = (d: Date) => `${d.getMonth() + 1}/${d.getDate()}`;
  return `${fmt(mon)} – ${fmt(sun)}`;
}

function addWeeks(weekKey: string, weeks: number): string {
  // Parse weekKey (e.g., "2026-W07")
  const [year, weekStr] = weekKey.split('-W');
  const weekNum = parseInt(weekStr, 10);

  // ISO week date calculation
  const jan4 = new Date(parseInt(year, 10), 0, 4);
  const jan4Day = jan4.getDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setDate(jan4.getDate() - jan4Day + 1);

  // Calculate Monday of the target week
  const targetMonday = new Date(week1Monday);
  targetMonday.setDate(week1Monday.getDate() + (weekNum - 1) * 7 + weeks * 7);

  // Calculate new week number for the target date
  const targetYear = targetMonday.getFullYear();
  const targetJan4 = new Date(targetYear, 0, 4);
  const targetJan4Day = targetJan4.getDay() || 7;
  const targetWeek1Monday = new Date(targetJan4);
  targetWeek1Monday.setDate(targetJan4.getDate() - targetJan4Day + 1);

  const daysDiff = Math.floor((targetMonday.getTime() - targetWeek1Monday.getTime()) / 86400000);
  const newWeekNum = Math.floor(daysDiff / 7) + 1;

  return `${targetYear}-W${String(newWeekNum).padStart(2, '0')}`;
}

// ── Styled Components ──

const PageWrapper = styled.div`
  max-width: 960px;
  margin: 0 auto;
  padding: ${({ theme }) => theme.spacing(3)};
`;

const Title = styled.h1`
  font-family: ${({ theme }) => theme.font.mono};
  font-size: 1.75rem;
  color: ${({ theme }) => theme.colors.ok};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.85rem;
  color: ${({ theme }) => theme.colors.subtext};
  margin: 4px 0 0;
`;

const WeekNavigation = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing(2)};
  margin-top: ${({ theme }) => theme.spacing(2)};
`;

const WeekLabel = styled.div`
  font-size: 1.1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.text};
  min-width: 140px;
  text-align: center;
`;

const NavButton = styled.button`
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  width: 36px;
  height: 36px;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bg};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:active {
    transform: scale(0.95);
  }
`;

const TodayButton = styled.button`
  background: ${({ theme }) => theme.colors.panel};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;

  &:hover {
    background: ${({ theme }) => theme.colors.bg};
    border-color: ${({ theme }) => theme.colors.accent};
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ProgressBarOuter = styled.div`
  background: ${({ theme }) => theme.colors.bg};
  border-radius: 99px;
  height: 10px;
  overflow: hidden;
`;

const ProgressBarInner = styled.div<{ $pct: number }>`
  height: 100%;
  width: ${({ $pct }) => Math.min($pct, 100)}%;
  border-radius: 99px;
  transition: width 0.4s ease;
  background: ${({ $pct, theme }) =>
    $pct >= 100
      ? `linear-gradient(90deg, ${theme.colors.ok}, #facc15)`
      : $pct >= 50
        ? 'linear-gradient(90deg, #facc15, #f59e0b)'
        : `linear-gradient(90deg, ${theme.colors.danger}, #f97316)`};
`;

const ChoreGrid = styled(Card)`
  padding: 0;
  overflow: hidden;
`;

const GridHeader = styled.div`
  display: grid;
  grid-template-columns: 1fr repeat(7, 44px) 68px;
  padding: 10px 14px;
  background: rgba(255, 255, 255, 0.03);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: 0.7rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.subtext};
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const GridRow = styled.div<{ $alt?: boolean; $extra?: boolean }>`
  display: grid;
  grid-template-columns: 1fr repeat(7, 44px) 68px;
  padding: 10px 14px;
  align-items: center;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ $alt, $extra }) =>
    $extra ? 'rgba(249, 115, 22, 0.04)' : $alt ? 'rgba(255, 255, 255, 0.015)' : 'transparent'};
`;

const CheckButton = styled.button<{ $checked: boolean; $isExtra?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: ${({ $checked, theme, $isExtra }) =>
    $checked ? 'none' : `2px solid ${theme.colors.border}`};
  background: ${({ $checked, $isExtra, theme }) =>
    $checked
      ? $isExtra
        ? 'linear-gradient(135deg, #f97316, #ea580c)'
        : `linear-gradient(135deg, ${theme.colors.ok}, #16a34a)`
      : 'transparent'};
  color: ${({ $checked }) => ($checked ? '#fff' : 'transparent')};
  font-size: 15px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: ${({ $checked, $isExtra, theme }) =>
    $checked ? `0 2px 8px ${$isExtra ? 'rgba(249,115,22,0.3)' : `${theme.colors.ok}44`}` : 'none'};

  &:hover {
    border-color: ${({ $checked, $isExtra, theme }) =>
      $checked ? 'transparent' : $isExtra ? '#f97316' : theme.colors.ok};
  }
`;

const Earned = styled.span<{ $hasValue: boolean; $isExtra?: boolean }>`
  text-align: right;
  font-family: ${({ theme }) => theme.font.mono};
  font-weight: 700;
  font-size: 0.85rem;
  color: ${({ $hasValue, $isExtra, theme }) =>
    $hasValue ? ($isExtra ? '#f97316' : theme.colors.ok) : theme.colors.subtext};
`;

const ChoreName = styled.div<{ $isExtra?: boolean }>`
  font-size: 0.9rem;
  font-weight: 500;
  color: ${({ $isExtra }) => ($isExtra ? '#f97316' : 'inherit')};
`;

const ChoreDetail = styled.div`
  font-size: 0.7rem;
  color: ${({ theme }) => theme.colors.subtext};
  margin-top: 2px;
`;

const CompletionBadge = styled.span<{ $met: boolean }>`
  margin-left: 6px;
  color: ${({ $met, theme }) => ($met ? theme.colors.ok : '#facc15')};
`;

const SectionLabel = styled.div<{ $color?: string }>`
  padding: 6px 14px;
  font-size: 0.65rem;
  font-weight: 600;
  color: ${({ $color }) => $color || '#f97316'};
  text-transform: uppercase;
  letter-spacing: 1px;
  background: rgba(249, 115, 22, 0.06);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const PaydayCard = styled(Card)`
  background: linear-gradient(135deg, #064e3b, #065f46);
  border-color: rgba(34, 197, 94, 0.2);
`;

const PaydayRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 6px 10px;
  background: rgba(15, 23, 42, 0.25);
  border-radius: 6px;
  margin-bottom: 4px;
  font-size: 0.85rem;
`;

const TotalLine = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 1.25rem;
  font-weight: 700;
  font-family: ${({ theme }) => theme.font.mono};
  margin-top: 8px;
`;

const LegendCard = styled(Card)`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.subtext};
  line-height: 1.8;
`;

// ── Component ──

export const Chores = () => {
  const choreService = useChoreService();
  const { user, logout } = useAuth();
  const [weekKey, setWeekKey] = useState(getCurrentWeekKey());
  const [summary, setSummary] = useState<ChoreWeeklySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showPayday, setShowPayday] = useState(false);
  const [newChore, setNewChore] = useState({ name: '', baseValue: '', timesPerWeek: '' });
  const [newExtra, setNewExtra] = useState({ name: '', value: '' });
  const [bonusSettings, setBonusSettings] = useState({
    overCompletionBonusPercent: 50,
    allChoresCompleteBonusPercent: 25,
  });
  const [editingChore, setEditingChore] = useState<string | null>(null);
  const [editChoreData, setEditChoreData] = useState<{
    name: string;
    baseValue: string;
    timesPerWeek: string;
  }>({ name: '', baseValue: '', timesPerWeek: '' });
  const [isPaid, setIsPaid] = useState(false);

  const isAdult = user?.role === 'adult';
  const isCurrentWeek = weekKey === getCurrentWeekKey();

  const loadSummary = useCallback(async () => {
    const result = await choreService.getWeeklySummary(weekKey);
    if (result.success) {
      setSummary(result.data);
      setBonusSettings({
        overCompletionBonusPercent: result.data.bonusSettings.overCompletionBonusPercent,
        allChoresCompleteBonusPercent: result.data.bonusSettings.allChoresCompleteBonusPercent,
      });
      // Check if this week has been paid (has a snapshot)
      setIsPaid(result.data.isPaid || false);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekKey]);

  useEffect(() => {
    loadSummary();
  }, [loadSummary]);

  const handlePreviousWeek = () => {
    setWeekKey((prev) => addWeeks(prev, -1));
  };

  const handleNextWeek = () => {
    setWeekKey((prev) => addWeeks(prev, 1));
  };

  const handleCurrentWeek = () => {
    setWeekKey(getCurrentWeekKey());
  };

  const handleToggle = async (choreId?: string, choreExtraId?: string, dayIndex?: number) => {
    if (dayIndex == null) return;
    await choreService.toggleCheck({ choreId, choreExtraId, weekKey, dayIndex });
    await loadSummary();
  };

  const handleAddChore = async () => {
    if (!newChore.name || !newChore.baseValue || !newChore.timesPerWeek) return;
    await choreService.createChore({
      name: newChore.name,
      baseValue: Number(newChore.baseValue),
      timesPerWeek: Number(newChore.timesPerWeek),
    });
    setNewChore({ name: '', baseValue: '', timesPerWeek: '' });
    await loadSummary();
  };

  const handleAddExtra = async () => {
    if (!newExtra.name || !newExtra.value) return;
    await choreService.createExtra({
      name: newExtra.name,
      value: Number(newExtra.value),
      weekKey,
    });
    setNewExtra({ name: '', value: '' });
    await loadSummary();
  };

  const handleDeleteChore = async (id: string) => {
    await choreService.deleteChore(id);
    await loadSummary();
  };

  const handleDeleteExtra = async (id: string) => {
    await choreService.deleteExtra(id);
    await loadSummary();
  };

  const handleStartEditChore = (chore: ChoreWithStats) => {
    setEditingChore(chore.id);
    setEditChoreData({
      name: chore.name,
      baseValue: String(chore.baseValue),
      timesPerWeek: String(chore.timesPerWeek),
    });
  };

  const handleSaveChore = async (id: string) => {
    if (!editChoreData.name || !editChoreData.baseValue || !editChoreData.timesPerWeek) return;
    await choreService.updateChore(id, {
      name: editChoreData.name,
      baseValue: Number(editChoreData.baseValue),
      timesPerWeek: Number(editChoreData.timesPerWeek),
    });
    setEditingChore(null);
    await loadSummary();
  };

  const handleCancelEditChore = () => {
    setEditingChore(null);
    setEditChoreData({ name: '', baseValue: '', timesPerWeek: '' });
  };

  const handleMarkAsPaid = async () => {
    if (
      !window.confirm(
        `Mark week ${getWeekLabel(weekKey)} as paid? This will create a snapshot and freeze the data for this week.`,
      )
    ) {
      return;
    }
    const result = await choreService.createSnapshot(weekKey);
    if (result.success) {
      setIsPaid(true);
      await loadSummary();
    }
  };

  const isChecked = (choreId?: string, choreExtraId?: string, dayIndex?: number): boolean => {
    if (!summary || dayIndex == null) return false;
    return summary.checks.some(
      (c: ChoreCheck) =>
        c.dayIndex === dayIndex &&
        ((choreId && c.choreId === choreId) || (choreExtraId && c.choreExtraId === choreExtraId)),
    );
  };

  // ── Print ──
  const handlePrint = (showCurrent: boolean) => {
    if (!summary) return;
    const w = window.open('', '_blank', 'width=1050,height=750');
    if (!w) return;

    const dayHeaders = DAYS.map(
      (d) =>
        `<th style="padding:8px 2px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:600;">${d}</th>`,
    ).join('');

    const choreRows = summary.chores
      .map((c: ChoreWithStats) => {
        const boxes = DAYS.map((_, di) => {
          const checked = showCurrent ? isChecked(c.id, undefined, di) : false;
          return `<td style="text-align:center;padding:5px;">
          <div style="width:30px;height:30px;border:2px solid ${checked ? '#16a34a' : '#bbb'};
            border-radius:4px;margin:auto;display:flex;align-items:center;justify-content:center;
            background:${checked ? '#dcfce7' : '#fff'};color:#16a34a;font-weight:bold;font-size:16px;">
            ${checked ? '✓' : '&nbsp;'}
          </div></td>`;
        }).join('');
        const earnedValue = showCurrent
          ? `$${c.earned.toFixed(2)}`
          : `$<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>`;
        return `<tr style="border-bottom:1px solid #e5e7eb;">
        <td style="padding:10px 12px;font-weight:600;font-size:14px;">${c.name}</td>
        <td style="padding:8px;text-align:center;font-size:13px;">$${Number(c.baseValue).toFixed(2)}</td>
        <td style="padding:8px;text-align:center;font-size:13px;">${c.timesPerWeek}x/wk</td>
        ${boxes}
        <td style="padding:8px;text-align:right;font-weight:700;font-size:14px;">
          ${earnedValue}
        </td>
      </tr>`;
      })
      .join('');

    // Only show extra chores section if there are any extras defined
    const extraRows =
      summary.extras.length > 0
        ? summary.extras
            .map((ex: ExtraWithStats) => {
              const boxes = DAYS.map((_, di) => {
                const checked = showCurrent ? isChecked(undefined, ex.id, di) : false;
                return `<td style="text-align:center;padding:5px;">
          <div style="width:30px;height:30px;border:2px solid ${checked ? '#ea580c' : '#bbb'};
            border-radius:4px;margin:auto;display:flex;align-items:center;justify-content:center;
            background:${checked ? '#fff7ed' : '#fff'};color:#ea580c;font-weight:bold;font-size:16px;">
            ${checked ? '✓' : '&nbsp;'}
          </div></td>`;
              }).join('');
              const earnedValue = showCurrent
                ? `$${ex.earned.toFixed(2)}`
                : `$<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>`;
              return `<tr style="border-bottom:1px solid #e5e7eb;background:#fffbf5;">
        <td style="padding:10px 12px;font-weight:600;font-size:14px;color:#c2410c;">⭐ ${ex.name}</td>
        <td style="padding:8px;text-align:center;font-size:13px;">$${Number(ex.value).toFixed(2)}</td>
        <td style="padding:8px;text-align:center;font-size:13px;color:#999;">—</td>
        ${boxes}
        <td style="padding:8px;text-align:right;font-weight:700;font-size:14px;">
          ${earnedValue}
        </td>
      </tr>`;
            })
            .join('')
        : '';

    const blankExtras = '';

    const html = `<!DOCTYPE html><html><head><title>Chore Bank – ${getWeekLabel(weekKey)}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@700&display=swap');
      * { box-sizing:border-box; margin:0; padding:0; }
      body { font-family:Inter,sans-serif; padding:0.35in 0.4in; background:#fff; color:#1a1a1a; }
      @media print { body { padding:0.25in; } @page { size:landscape; margin:0.25in; } }
      table { width:100%; border-collapse:collapse; } th { background:#f8f9fa; }
    </style></head><body>
      <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:4px;">
        <h1 style="font-family:'JetBrains Mono',monospace;font-size:26px;color:#16a34a;">💰 CHORE BANK</h1>
        <span style="font-size:14px;color:#666;">Week of ${getWeekLabel(weekKey)}</span>
      </div>
      <p style="font-size:12px;color:#999;margin-bottom:12px;">Do the work, get the bread.</p>
      <table>
        <thead><tr style="border-bottom:2px solid #333;">
          <th style="padding:8px 12px;text-align:left;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:600;">Chore</th>
          <th style="padding:8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:600;">Each</th>
          <th style="padding:8px;text-align:center;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:600;">Freq</th>
          ${dayHeaders}
          <th style="padding:8px;text-align:right;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:600;">Earned</th>
        </tr></thead>
        <tbody>${choreRows}${extraRows}${blankExtras}</tbody>
      </table>
      <div style="margin-top:12px;display:flex;gap:16px;justify-content:flex-end;align-items:center;flex-wrap:wrap;padding:10px 14px;background:#f0fdf4;border-radius:8px;border:1px solid #bbf7d0;">
        <span style="font-size:13px;">Base: <strong>${showCurrent ? `$${summary.baseEarned.toFixed(2)}` : `$<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>`}</strong></span>
        <span style="font-size:13px;color:#ca8a04;">🌟 Bonus: <strong>${showCurrent ? `$${summary.bonusAmount.toFixed(2)}` : `$<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>`}</strong></span>
        ${summary.extras.length > 0 ? `<span style="font-size:13px;">Extras: <strong>${showCurrent ? `$${summary.extrasEarned.toFixed(2)}` : `$<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>`}</strong></span>` : ''}
        <span style="font-size:18px;font-family:'JetBrains Mono',monospace;font-weight:700;color:#16a34a;">TOTAL: ${showCurrent ? `$${summary.grandTotal.toFixed(2)}` : `$<u>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</u>`}</span>
      </div>
      <div style="margin-top:10px;padding:10px 14px;background:#fefce8;border-radius:8px;border:1px solid #fde68a;font-size:11px;color:#713f12;line-height:1.8;">
        <strong>How it works:</strong><br/>
        ✓ Each chore earns its $ value when done the required # of times per week.<br/>
        ✓ Extra completions beyond the requirement earn 100% + ${summary.bonusSettings.overCompletionBonusPercent}% bonus (total ${100 + summary.bonusSettings.overCompletionBonusPercent}%).<br/>
        🌟 Complete ALL base chores 100%? <span style="color:#ca8a04;font-weight:600;">${summary.bonusSettings.allChoresCompleteBonusPercent}% bonus on everything!</span><br/>
        ${summary.extras.length > 0 ? `⭐ <span style="color:#c2410c;">Extra chores</span> are elective one-offs — add them in Edit mode.<br/>` : ''}
        ❌ Skip a chore entirely? $0 for that one.
      </div>
    </body></html>`;

    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
  };

  if (loading) {
    return (
      <PageWrapper>
        <p style={{ color: '#a8b3c7', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
      </PageWrapper>
    );
  }

  if (!summary) {
    return (
      <PageWrapper>
        <p style={{ color: '#ff6b6b', textAlign: 'center', padding: '40px 0' }}>
          Failed to load chore data.
        </p>
      </PageWrapper>
    );
  }

  const pct = Math.round(summary.completionRate * 100);

  return (
    <PageWrapper>
      {/* Header */}
      <HStack style={{ justifyContent: 'space-between', marginBottom: 16 }} stackOnMobile>
        <div>
          <Title>💰 CHORE BANK</Title>
          <Subtitle>{user?.name || user?.email}</Subtitle>
          <WeekNavigation>
            <NavButton onClick={handlePreviousWeek} title="Previous week">
              ‹
            </NavButton>
            <WeekLabel>{getWeekLabel(weekKey)}</WeekLabel>
            <NavButton onClick={handleNextWeek} title="Next week">
              ›
            </NavButton>
            <TodayButton onClick={handleCurrentWeek} disabled={isCurrentWeek}>
              Current Week
            </TodayButton>
          </WeekNavigation>
        </div>
        <HStack gap={1}>
          {isAdult && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setEditMode(!editMode)}>
                {editMode ? '✓ Done' : '⚙ Edit'}
              </Button>
              <Button size="sm" onClick={() => setShowPayday(!showPayday)}>
                💵 Payday
              </Button>
              <Button variant="secondary" size="sm" onClick={() => handlePrint(false)}>
                🖨 Print Empty
              </Button>
              <Button size="sm" onClick={() => handlePrint(true)}>
                🖨 Print Current
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={logout}>
            🚪 Logout
          </Button>
        </HStack>
      </HStack>

      {/* Payday breakdown */}
      {showPayday && (
        <PaydayCard style={{ marginBottom: 16 }}>
          <VStack gap={1}>
            <HStack style={{ justifyContent: 'space-between', alignItems: 'center' }}>
              <h3
                style={{
                  fontFamily: 'var(--font-mono, JetBrains Mono, monospace)',
                  fontSize: '1rem',
                  color: '#22c55e',
                  margin: 0,
                }}
              >
                💵 PAYDAY BREAKDOWN
              </h3>
              {isAdult && isCurrentWeek && !isPaid && (
                <Button size="sm" onClick={handleMarkAsPaid}>
                  ✓ Mark as Paid
                </Button>
              )}
              {isPaid && (
                <span style={{ fontSize: '0.75rem', color: '#22c55e', fontWeight: 600 }}>
                  ✓ PAID
                </span>
              )}
            </HStack>
            {summary.chores.map((c: ChoreWithStats) => (
              <PaydayRow key={c.id}>
                <span>
                  {c.name}{' '}
                  <span style={{ color: '#94a3b8', fontSize: '0.75rem', marginLeft: 6 }}>
                    {c.completions}/{c.timesPerWeek}
                  </span>
                </span>
                <Earned $hasValue={c.earned > 0}>${c.earned.toFixed(2)}</Earned>
              </PaydayRow>
            ))}
            {summary.extras.length > 0 && (
              <>
                <div
                  style={{
                    fontSize: '0.65rem',
                    color: '#f97316',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                    marginTop: 4,
                  }}
                >
                  ⭐ Extra Chores
                </div>
                {summary.extras.map((ex: ExtraWithStats) => (
                  <PaydayRow key={ex.id}>
                    <span style={{ color: '#f97316' }}>
                      ⭐ {ex.name}{' '}
                      <span style={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                        ({ex.completions}x)
                      </span>
                    </span>
                    <Earned $hasValue={ex.earned > 0} $isExtra>
                      ${ex.earned.toFixed(2)}
                    </Earned>
                  </PaydayRow>
                ))}
              </>
            )}
            <div
              style={{ borderTop: '1px solid rgba(34,197,94,0.2)', paddingTop: 10, marginTop: 4 }}
            >
              <HStack
                style={{ justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}
              >
                <span>Base chores</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>
                  ${summary.baseEarned.toFixed(2)}
                </span>
              </HStack>
              {summary.bonusActive && (
                <HStack
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#facc15',
                    marginTop: 3,
                  }}
                >
                  <span>🌟 100% Bonus (+25%)</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    +${summary.bonusAmount.toFixed(2)}
                  </span>
                </HStack>
              )}
              {summary.extrasEarned > 0 && (
                <HStack
                  style={{
                    justifyContent: 'space-between',
                    fontSize: '0.85rem',
                    color: '#f97316',
                    marginTop: 3,
                  }}
                >
                  <span>Extra chores</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>
                    +${summary.extrasEarned.toFixed(2)}
                  </span>
                </HStack>
              )}
              <TotalLine>
                <span>TOTAL</span>
                <span style={{ color: '#22c55e' }}>${summary.grandTotal.toFixed(2)}</span>
              </TotalLine>
            </div>
          </VStack>
        </PaydayCard>
      )}

      {/* Progress bar */}
      <Card style={{ marginBottom: 16 }}>
        <HStack style={{ justifyContent: 'space-between', marginBottom: 6, fontSize: '0.75rem' }}>
          <span style={{ color: '#a8b3c7' }}>Weekly Progress</span>
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: pct >= 100 ? '#22c55e' : pct >= 50 ? '#facc15' : '#ff6b6b',
            }}
          >
            {pct}%
          </span>
        </HStack>
        <ProgressBarOuter>
          <ProgressBarInner $pct={pct} />
        </ProgressBarOuter>
        <HStack
          style={{
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: '0.7rem',
            color: '#a8b3c7',
          }}
        >
          <span>
            Earned: <Earned $hasValue>{summary.grandTotal.toFixed(2)}</Earned>
          </span>
        </HStack>
      </Card>

      {/* Edit mode */}
      {editMode && (
        <Card style={{ marginBottom: 16, borderColor: 'rgba(250,204,21,0.25)' }}>
          <VStack gap={2}>
            <h3 style={{ fontSize: '0.9rem', color: '#facc15', margin: 0 }}>Edit Base Chores</h3>
            {summary.chores.map((c: ChoreWithStats) => (
              <div key={c.id}>
                {editingChore === c.id ? (
                  <HStack gap={1} wrap style={{ marginBottom: 8 }}>
                    <FormInput
                      label=""
                      placeholder="Chore name"
                      value={editChoreData.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditChoreData({ ...editChoreData, name: e.target.value })
                      }
                      style={{ flex: '1 1 130px', minWidth: 110 }}
                    />
                    <FormInput
                      label=""
                      placeholder="$ each"
                      type="number"
                      step="0.25"
                      min="0"
                      value={editChoreData.baseValue}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditChoreData({ ...editChoreData, baseValue: e.target.value })
                      }
                      style={{ width: 80 }}
                    />
                    <FormInput
                      label=""
                      placeholder="x/wk"
                      type="number"
                      min="1"
                      max="7"
                      value={editChoreData.timesPerWeek}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEditChoreData({ ...editChoreData, timesPerWeek: e.target.value })
                      }
                      style={{ width: 65 }}
                    />
                    <Button size="sm" onClick={() => handleSaveChore(c.id)}>
                      ✓ Save
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEditChore}>
                      Cancel
                    </Button>
                  </HStack>
                ) : (
                  <HStack style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.85rem' }}>
                      {c.name}{' '}
                      <span style={{ color: '#a8b3c7', fontSize: '0.7rem', marginLeft: 6 }}>
                        ${Number(c.baseValue).toFixed(2)} × {c.timesPerWeek}/wk
                      </span>
                    </span>
                    <HStack gap={1}>
                      <Button variant="secondary" size="sm" onClick={() => handleStartEditChore(c)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDeleteChore(c.id)}>
                        Remove
                      </Button>
                    </HStack>
                  </HStack>
                )}
              </div>
            ))}
            <HStack gap={1} wrap>
              <FormInput
                label=""
                placeholder="Chore name"
                value={newChore.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewChore({ ...newChore, name: e.target.value })
                }
                style={{ flex: '1 1 130px', minWidth: 110 }}
              />
              <FormInput
                label=""
                placeholder="$ each"
                type="number"
                step="0.25"
                min="0"
                value={newChore.baseValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewChore({ ...newChore, baseValue: e.target.value })
                }
                style={{ width: 80 }}
              />
              <FormInput
                label=""
                placeholder="x/wk"
                type="number"
                min="1"
                max="7"
                value={newChore.timesPerWeek}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewChore({ ...newChore, timesPerWeek: e.target.value })
                }
                style={{ width: 65 }}
              />
              <Button size="sm" onClick={handleAddChore}>
                + Add
              </Button>
            </HStack>

            <h3 style={{ fontSize: '0.9rem', color: '#f97316', margin: '8px 0 0' }}>
              ⭐ Extra Chores (this week)
            </h3>
            {summary.extras.map((ex: ExtraWithStats) => (
              <HStack key={ex.id} style={{ justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.85rem', color: '#f97316' }}>
                  ⭐ {ex.name}{' '}
                  <span style={{ color: '#a8b3c7', fontSize: '0.7rem', marginLeft: 6 }}>
                    ${Number(ex.value).toFixed(2)} each
                  </span>
                </span>
                <Button variant="danger" size="sm" onClick={() => handleDeleteExtra(ex.id)}>
                  Remove
                </Button>
              </HStack>
            ))}
            <HStack gap={1} wrap>
              <FormInput
                label=""
                placeholder="Extra chore name"
                value={newExtra.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewExtra({ ...newExtra, name: e.target.value })
                }
                style={{ flex: '1 1 150px', minWidth: 120 }}
              />
              <FormInput
                label=""
                placeholder="$ value"
                type="number"
                step="0.50"
                min="0"
                value={newExtra.value}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setNewExtra({ ...newExtra, value: e.target.value })
                }
                style={{ width: 80 }}
              />
              <Button size="sm" onClick={handleAddExtra}>
                + Add Extra
              </Button>
            </HStack>

            <h3
              style={{
                fontSize: '0.9rem',
                color: '#7c9cff',
                margin: '16px 0 0',
                borderTop: '1px solid #2a2f3a',
                paddingTop: 16,
              }}
            >
              Bonus Settings
            </h3>
            <VStack gap={2}>
              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    color: '#a8b3c7',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  Over-completion bonus (%)
                </label>
                <HStack gap={1}>
                  <FormInput
                    type="number"
                    min="0"
                    max="100"
                    value={bonusSettings.overCompletionBonusPercent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBonusSettings({
                        ...bonusSettings,
                        overCompletionBonusPercent: Number(e.target.value),
                      })
                    }
                    style={{ width: 80 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#a8b3c7' }}>
                    % bonus on top of 100% for each completion beyond required (e.g., 25% = 125%
                    total)
                  </span>
                </HStack>
              </div>
              <div>
                <label
                  style={{
                    fontSize: '0.85rem',
                    color: '#a8b3c7',
                    display: 'block',
                    marginBottom: 4,
                  }}
                >
                  All chores complete bonus (%)
                </label>
                <HStack gap={1}>
                  <FormInput
                    type="number"
                    min="0"
                    max="100"
                    value={bonusSettings.allChoresCompleteBonusPercent}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setBonusSettings({
                        ...bonusSettings,
                        allChoresCompleteBonusPercent: Number(e.target.value),
                      })
                    }
                    style={{ width: 80 }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#a8b3c7' }}>
                    % bonus on everything when all base chores are 100%
                  </span>
                </HStack>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  const result = await choreService.updateBonusSettings(bonusSettings);
                  if (result.success) {
                    await loadSummary();
                  }
                }}
                style={{ alignSelf: 'flex-start', marginTop: 8 }}
              >
                Save Bonus Settings
              </Button>
            </VStack>
          </VStack>
        </Card>
      )}

      {/* Chore grid */}
      <ChoreGrid>
        <GridHeader>
          <div>Chore</div>
          {DAYS.map((d) => (
            <div key={d} style={{ textAlign: 'center' }}>
              {d}
            </div>
          ))}
          <div style={{ textAlign: 'right' }}>Earned</div>
        </GridHeader>

        {summary.chores.map((chore: ChoreWithStats, i: number) => (
          <GridRow key={chore.id} $alt={i % 2 === 1}>
            <div>
              <ChoreName>{chore.name}</ChoreName>
              <ChoreDetail>
                ${Number(chore.baseValue).toFixed(2)} × {chore.timesPerWeek}/wk
                {chore.completions > 0 && (
                  <CompletionBadge $met={chore.completions >= chore.timesPerWeek}>
                    ({chore.completions}/{chore.timesPerWeek})
                  </CompletionBadge>
                )}
              </ChoreDetail>
            </div>
            {DAYS.map((_, di) => {
              const checked = isChecked(chore.id, undefined, di);
              return (
                <div key={di} style={{ display: 'flex', justifyContent: 'center' }}>
                  <CheckButton
                    $checked={checked}
                    title={checked ? `Done – click to undo` : `${chore.name} – ${FULL_DAYS[di]}`}
                    onClick={() => handleToggle(chore.id, undefined, di)}
                  >
                    {checked ? '✓' : ''}
                  </CheckButton>
                </div>
              );
            })}
            <Earned $hasValue={chore.earned > 0}>${chore.earned.toFixed(2)}</Earned>
          </GridRow>
        ))}

        {summary.extras.length > 0 && <SectionLabel>⭐ Extra Chores</SectionLabel>}
        {summary.extras.map((ex: ExtraWithStats) => (
          <GridRow key={ex.id} $extra>
            <div>
              <ChoreName $isExtra>{ex.name}</ChoreName>
              <ChoreDetail>
                ${Number(ex.value).toFixed(2)} each · {ex.completions}x done
              </ChoreDetail>
            </div>
            {DAYS.map((_, di) => {
              const checked = isChecked(undefined, ex.id, di);
              return (
                <div key={di} style={{ display: 'flex', justifyContent: 'center' }}>
                  <CheckButton
                    $checked={checked}
                    $isExtra
                    onClick={() => handleToggle(undefined, ex.id, di)}
                  >
                    {checked ? '✓' : ''}
                  </CheckButton>
                </div>
              );
            })}
            <Earned $hasValue={ex.earned > 0} $isExtra>
              ${ex.earned.toFixed(2)}
            </Earned>
          </GridRow>
        ))}
      </ChoreGrid>

      <LegendCard style={{ marginTop: 14 }}>
        <strong style={{ color: '#e7ebf3' }}>How it works:</strong>
        <br />
        ✓ Each chore earns its $ value when done the required # of times per week.
        <br />✓ Extra completions beyond the requirement earn 100% +{' '}
        {bonusSettings.overCompletionBonusPercent}% bonus (total{' '}
        {100 + bonusSettings.overCompletionBonusPercent}%).
        <br />
        🌟 Complete ALL base chores 100%?{' '}
        <span style={{ color: '#facc15' }}>
          {bonusSettings.allChoresCompleteBonusPercent}% bonus on everything!
        </span>
        <br />⭐ <span style={{ color: '#f97316' }}>Extra chores</span> are elective one-offs — add
        them in Edit mode.
      </LegendCard>
    </PageWrapper>
  );
};
