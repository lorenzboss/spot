'use client';

import { Id } from '@/convex/_generated/dataModel';
import { Card, Chip, Table } from '@heroui/react';
import { BarChart3 } from 'lucide-react';
import Dialog from './Dialog';

type UserRow = {
  _id: Id<'users'>;
  username: string | null;
  email: string | null;
};

interface Props {
  user: UserRow;
  gameStats: {
    userId: Id<'users'>;
    totalGames: number;
    averages: {
      score: number;
      turns: number;
      time: number;
      accuracy: number;
    } | null;
    games: {
      _id: string;
      score: number;
      turns: number;
      time: number;
      accuracy: number;
      playedAt: number;
    }[];
  };
  onClose: () => void;
}

function formatTime(totalSeconds: number) {
  const safe = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(safe / 60);
  const seconds = safe % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

const dateFormatter = new Intl.DateTimeFormat('de-CH', {
  dateStyle: 'medium',
  timeStyle: 'short',
});

export default function UserGamesDialog({ user, gameStats, onClose }: Props) {
  const displayName = user.username ?? user.email ?? 'Unknown user';

  return (
    <Dialog title={`Games - ${displayName}`} onClose={onClose} panelClassName="max-w-4xl">
      {gameStats.totalGames === 0 ? (
        <Card className="border border-slate-200 bg-slate-50 shadow-none">
          <Card.Content className="p-4 text-sm text-slate-500">
          This user has not played any games yet.
          </Card.Content>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <Card className="border border-slate-200 bg-slate-50 shadow-none">
              <Card.Content className="p-3">
                <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Games</div>
                <div className="mt-1 text-lg font-semibold text-slate-800">{gameStats.totalGames}</div>
              </Card.Content>
            </Card>
            <Card className="border border-slate-200 bg-slate-50 shadow-none">
              <Card.Content className="p-3">
                <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg score</div>
                <div className="mt-1 text-lg font-semibold text-slate-800">
                  {Math.round(gameStats.averages?.score ?? 0).toLocaleString()}
                </div>
              </Card.Content>
            </Card>
            <Card className="border border-slate-200 bg-slate-50 shadow-none">
              <Card.Content className="p-3">
                <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg turns</div>
                <div className="mt-1 text-lg font-semibold text-slate-800">
                  {(gameStats.averages?.turns ?? 0).toFixed(1)}
                </div>
              </Card.Content>
            </Card>
            <Card className="border border-slate-200 bg-slate-50 shadow-none">
              <Card.Content className="p-3">
                <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg time</div>
                <div className="mt-1 text-lg font-semibold text-slate-800">
                  {formatTime(gameStats.averages?.time ?? 0)}
                </div>
              </Card.Content>
            </Card>
            <Card className="border border-slate-200 bg-slate-50 shadow-none">
              <Card.Content className="p-3">
                <div className="text-xs font-semibold tracking-wide text-slate-400 uppercase">Avg accuracy</div>
                <div className="mt-1 text-lg font-semibold text-slate-800">
                  {(gameStats.averages?.accuracy ?? 0).toFixed(1)}%
                </div>
              </Card.Content>
            </Card>
          </div>

          <Card className="overflow-hidden border border-slate-200 shadow-none">
            <Card.Content className="max-h-96 overflow-y-auto p-0">
              <Table aria-label="User games table" className="text-sm">
                <Table.Header>
                  <Table.Column>#</Table.Column>
                  <Table.Column>SCORE</Table.Column>
                  <Table.Column>TURNS</Table.Column>
                  <Table.Column>TIME</Table.Column>
                  <Table.Column>ACCURACY</Table.Column>
                  <Table.Column>PLAYED</Table.Column>
                </Table.Header>
                <Table.Body>
                  {gameStats.games.map((game, index) => (
                    <Table.Row key={game._id}>
                      <Table.Cell className="font-mono text-slate-500 tabular-nums">{index + 1}</Table.Cell>
                      <Table.Cell className="font-mono text-slate-800 tabular-nums">{game.score.toLocaleString()}</Table.Cell>
                      <Table.Cell className="font-mono text-slate-700 tabular-nums">{game.turns}</Table.Cell>
                      <Table.Cell className="font-mono text-slate-700 tabular-nums">{formatTime(game.time)}</Table.Cell>
                      <Table.Cell className="font-mono text-slate-700 tabular-nums">{game.accuracy}%</Table.Cell>
                      <Table.Cell className="text-slate-600">{dateFormatter.format(game.playedAt)}</Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Card.Content>
          </Card>

          <div className="flex items-center gap-2 text-xs text-slate-500">
            <BarChart3 className="h-3.5 w-3.5" />
            <Chip size="sm" variant="soft" className="bg-slate-100 text-slate-600">
              Showing all games played by this user.
            </Chip>
          </div>
        </div>
      )}
    </Dialog>
  );
}
