'use client';

import { api } from '@/convex/_generated/api';
import { Card, Chip, Table } from '@heroui/react';
import { useQuery } from 'convex/react';
import { Medal } from 'lucide-react';

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
}

function formatScore(score: number) {
  return Math.trunc(score)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, "'");
}

export default function Leaderboard() {
  const topScores = useQuery(api.scoreFunctions.getTopScores);

  if (!topScores || topScores.length === 0) {
    return (
      <Card className="w-full border border-slate-100 shadow-sm">
        <Card.Header className="mb-1 flex items-center gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
          <Medal className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6" />
          <Card.Title className="text-lg font-bold text-slate-800 sm:text-xl">Leaderboard</Card.Title>
        </Card.Header>
        <Card.Content className="px-4 pt-1 pb-4 text-center text-sm text-slate-500 sm:px-6 sm:pb-6 sm:text-base">
          No games played yet. Be the first to set a record!
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card className="w-full border border-slate-100 shadow-sm">
      <Card.Header className="mb-1 flex items-center gap-2 px-4 pt-4 sm:px-6 sm:pt-6">
        <Medal className="h-5 w-5 text-yellow-500 sm:h-6 sm:w-6" />
        <Card.Title className="text-lg font-bold text-slate-800 sm:text-xl">Leaderboard</Card.Title>
      </Card.Header>
      <Card.Content className="px-2 pt-1 pb-2 sm:px-4 sm:pb-4">
        <Table aria-label="Leaderboard table" className="text-sm">
          <Table.Header>
            <Table.Column>#</Table.Column>
            <Table.Column>PLAYER</Table.Column>
            <Table.Column>STATS</Table.Column>
            <Table.Column>SCORE</Table.Column>
          </Table.Header>
          <Table.Body>
            {topScores.map((score, index) => (
              <Table.Row key={score._id}>
                <Table.Cell>
                  <Chip
                    size="sm"
                    variant="flat"
                    className={
                      index === 0
                        ? 'bg-yellow-100 text-yellow-700'
                        : index === 1
                          ? 'bg-slate-200 text-slate-700'
                          : index === 2
                            ? 'bg-orange-100 text-orange-700'
                            : 'bg-slate-100 text-slate-600'
                    }
                  >
                    {index + 1}
                  </Chip>
                </Table.Cell>
                <Table.Cell className="max-w-[140px] truncate font-semibold text-slate-700 sm:max-w-none">
                  {score.username ?? 'Anonymous'}
                </Table.Cell>
                <Table.Cell className="text-[11px] text-slate-500 sm:text-sm">
                  {score.turns} turns · {formatTime(score.time)} · {score.accuracy}% acc
                </Table.Cell>
                <Table.Cell className="font-bold text-blue-600">{formatScore(score.score)}</Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card.Content>
    </Card>
  );
}
