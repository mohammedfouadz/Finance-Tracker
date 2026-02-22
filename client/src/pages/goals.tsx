import { Layout } from "@/components/layout-sidebar";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, useGoalContributions, useCreateGoalContribution } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type InsertGoal } from "@shared/schema";
import { Trophy, Target, Calendar, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCurrency } from "@/lib/currency";
import { format } from "date-fns";
import { z } from "zod";

const formSchema = insertGoalSchema.extend({
  targetAmount: z.string().refine(val => Number(val) > 0, "Must be positive"),
  currentAmount: z.string().refine(val => Number(val) >= 0, "Must be non-negative"),
  deadline: z.coerce.date().optional(),
});

type FormValues = z.infer<typeof formSchema>;

function GoalDialog() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const createGoal = useCreateGoal();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: user?.id,
      name: "",
      targetAmount: "",
      currentAmount: "0",
    }
  });

  const onSubmit = async (values: FormValues) => {
    await createGoal.mutateAsync({ ...values, userId: user!.id });
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="shadow-lg shadow-accent/20" data-testid="button-add-goal">
          <Plus className="w-4 h-4 mr-2" /> Add Goal
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Set New Financial Goal</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl><Input placeholder="Vacation, Car, House..." {...field} data-testid="input-goal-name" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Amount</FormLabel>
                  <FormControl><Input type="number" placeholder="10000" {...field} data-testid="input-target-amount" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="currentAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Starting Amount</FormLabel>
                  <FormControl><Input type="number" placeholder="0" {...field} data-testid="input-current-amount" /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="deadline"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Date (Optional)</FormLabel>
                  <FormControl>
                    <Input 
                      type="date" 
                      value={field.value instanceof Date ? field.value.toISOString().split('T')[0] : field.value || ''}
                      onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      data-testid="input-deadline"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createGoal.isPending} data-testid="button-submit-goal">
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function GoalContributions({ goalId }: { goalId: number }) {
  const { data: contributions, isLoading } = useGoalContributions(goalId);
  const { formatAmount } = useCurrency();

  if (isLoading) return <p className="text-sm text-muted-foreground py-2">Loading...</p>;

  const recent = (contributions as any[] || [])
    .sort((a: any, b: any) => new Date(b.contributionDate).getTime() - new Date(a.contributionDate).getTime())
    .slice(0, 5);

  if (recent.length === 0) {
    return <p className="text-sm text-muted-foreground py-2" data-testid={`text-no-contributions-${goalId}`}>No contributions yet.</p>;
  }

  return (
    <div className="space-y-2" data-testid={`list-contributions-${goalId}`}>
      {recent.map((c: any) => (
        <div key={c.id} className="flex justify-between items-center text-sm py-1 border-b border-dashed last:border-0 dark:border-gray-700" data-testid={`row-contribution-${c.id}`}>
          <div>
            <span className="text-muted-foreground">{format(new Date(c.contributionDate), 'MMM d, yyyy')}</span>
            {c.notes && <span className="ml-2 text-muted-foreground italic">- {c.notes}</span>}
          </div>
          <span className="font-mono font-semibold text-green-600 dark:text-green-400" data-testid={`text-contribution-amount-${c.id}`}>+{formatAmount(Number(c.amount))}</span>
        </div>
      ))}
    </div>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();
  const createGoalContribution = useCreateGoalContribution();
  const { formatAmount } = useCurrency();

  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [contributionForm, setContributionForm] = useState({ amount: "", notes: "" });
  const [expandedGoals, setExpandedGoals] = useState<Set<number>>(new Set());

  const toggleExpanded = (goalId: number) => {
    setExpandedGoals(prev => {
      const next = new Set(prev);
      if (next.has(goalId)) next.delete(goalId);
      else next.add(goalId);
      return next;
    });
  };

  const handleContributionSubmit = async (goalId: number) => {
    const amount = Number(contributionForm.amount);
    if (!amount || amount <= 0) return;
    await createGoalContribution.mutateAsync({
      goalId,
      amount: contributionForm.amount,
      contributionDate: new Date(),
      notes: contributionForm.notes || undefined,
    });
    setSelectedGoalId(null);
    setContributionForm({ amount: "", notes: "" });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-[#1a1a1a] dark:text-white" data-testid="text-page-title">Financial Goals</h2>
          <p className="text-[#666666] dark:text-gray-400 mt-1">Track your progress towards your dreams.</p>
        </div>
        <GoalDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
          const isContributing = selectedGoalId === goal.id;
          const isExpanded = expandedGoals.has(goal.id);
          
          return (
            <div key={goal.id} className="space-y-3">
              <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-gray-900 relative" data-testid={`card-goal-${goal.id}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10" />

                <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent">
                    <Trophy className="w-6 h-6" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground"
                    onClick={() => confirm("Delete goal?") && deleteGoal.mutate(goal.id)}
                    data-testid={`button-delete-goal-${goal.id}`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardHeader>

                <CardContent>
                  <h3 className="text-xl font-bold mb-1 text-[#1a1a1a] dark:text-white" data-testid={`text-goal-name-${goal.id}`}>{goal.name}</h3>
                  
                  <div className="flex items-center gap-2 text-sm text-[#666] dark:text-gray-400 mb-6">
                    {goal.deadline ? (
                      <>
                        <Calendar className="w-4 h-4" />
                        <span>Target: {format(new Date(goal.deadline), 'MMM yyyy')}</span>
                      </>
                    ) : (
                      <span className="italic">No deadline set</span>
                    )}
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex justify-between gap-2 text-sm font-medium flex-wrap">
                      <span className="text-[#666] dark:text-gray-400">Progress</span>
                      <span className="text-[#1a1a1a] dark:text-white" data-testid={`text-goal-progress-${goal.id}`}>{progress.toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(progress, 100)} className="h-2" />
                  </div>

                  <div className="flex justify-between items-end gap-2 flex-wrap">
                    <div>
                      <p className="text-xs text-[#999] dark:text-gray-500 mb-1">Current</p>
                      <p className="text-lg font-mono font-bold text-[#1a1a1a] dark:text-white" data-testid={`text-goal-current-${goal.id}`}>{formatAmount(Number(goal.currentAmount))}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-[#999] dark:text-gray-500 mb-1">Target</p>
                      <p className="text-lg font-mono font-bold text-accent" data-testid={`text-goal-target-${goal.id}`}>{formatAmount(Number(goal.targetAmount))}</p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t dark:border-gray-700 flex gap-2 flex-wrap">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => {
                        if (isContributing) {
                          setSelectedGoalId(null);
                          setContributionForm({ amount: "", notes: "" });
                        } else {
                          setSelectedGoalId(goal.id);
                          setContributionForm({ amount: "", notes: "" });
                        }
                      }}
                      data-testid={`button-add-contribution-${goal.id}`}
                    >
                      <Plus className="w-3 h-3 mr-1" /> Add Contribution
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(goal.id)}
                      data-testid={`button-toggle-contributions-${goal.id}`}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </Button>
                  </div>

                  {isContributing && (
                    <div className="mt-4 p-4 rounded-xl bg-muted/50 dark:bg-gray-800 space-y-3" data-testid={`form-contribution-${goal.id}`}>
                      <div>
                        <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Amount</label>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          value={contributionForm.amount}
                          onChange={(e) => setContributionForm(prev => ({ ...prev, amount: e.target.value }))}
                          data-testid={`input-contribution-amount-${goal.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Date</label>
                        <Input
                          type="date"
                          defaultValue={new Date().toISOString().split('T')[0]}
                          disabled
                          data-testid={`input-contribution-date-${goal.id}`}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-[#666] dark:text-gray-400 mb-1 block">Notes (optional)</label>
                        <Input
                          placeholder="e.g. Monthly savings"
                          value={contributionForm.notes}
                          onChange={(e) => setContributionForm(prev => ({ ...prev, notes: e.target.value }))}
                          data-testid={`input-contribution-notes-${goal.id}`}
                        />
                      </div>
                      <Button
                        size="sm"
                        className="w-full"
                        disabled={createGoalContribution.isPending || !contributionForm.amount}
                        onClick={() => handleContributionSubmit(goal.id)}
                        data-testid={`button-submit-contribution-${goal.id}`}
                      >
                        {createGoalContribution.isPending ? "Saving..." : "Submit Contribution"}
                      </Button>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t dark:border-gray-700">
                      <h4 className="text-sm font-semibold text-[#666] dark:text-gray-400 mb-2">Recent Contributions</h4>
                      <GoalContributions goalId={goal.id} />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </Layout>
  );
}
