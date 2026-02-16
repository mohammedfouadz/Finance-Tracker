import { Layout } from "@/components/layout-sidebar";
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/use-finance";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGoalSchema, type InsertGoal } from "@shared/schema";
import { Trophy, Target, Calendar, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
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
        <Button className="shadow-lg shadow-accent/20">
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
                  <FormControl><Input placeholder="Vacation, Car, House..." {...field} /></FormControl>
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
                  <FormControl><Input type="number" placeholder="10000" {...field} /></FormControl>
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
                  <FormControl><Input type="number" placeholder="0" {...field} /></FormControl>
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
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={createGoal.isPending}>
              {createGoal.isPending ? "Creating..." : "Create Goal"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const deleteGoal = useDeleteGoal();
  const updateGoal = useUpdateGoal();

  if (isLoading) return <Layout><p>Loading...</p></Layout>;

  return (
    <Layout>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Financial Goals</h2>
          <p className="text-muted-foreground mt-1">Track your progress towards your dreams.</p>
        </div>
        <GoalDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {goals?.map((goal) => {
          const progress = (Number(goal.currentAmount) / Number(goal.targetAmount)) * 100;
          
          return (
            <Card key={goal.id} className="group border-none shadow-lg hover:shadow-xl transition-all duration-300 relative overflow-hidden">
              {/* Decorative background gradient */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-3xl -z-10 group-hover:bg-accent/10 transition-colors" />

              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="p-2 bg-accent/10 rounded-lg text-accent">
                  <Trophy className="w-6 h-6" />
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => confirm("Delete goal?") && deleteGoal.mutate(goal.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </CardHeader>

              <CardContent>
                <h3 className="text-xl font-bold mb-1">{goal.name}</h3>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
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
                  <div className="flex justify-between text-sm font-medium">
                    <span className="text-muted-foreground">Progress</span>
                    <span>{progress.toFixed(0)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" indicatorClassName="bg-accent" />
                </div>

                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Current</p>
                    <p className="text-lg font-mono font-bold">${Number(goal.currentAmount).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground mb-1">Target</p>
                    <p className="text-lg font-mono font-bold text-accent">${Number(goal.targetAmount).toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex gap-2">
                   <Button 
                     variant="outline" 
                     size="sm" 
                     className="flex-1"
                     onClick={() => {
                        const amount = prompt("Enter amount to add:");
                        if (amount && !isNaN(Number(amount))) {
                          updateGoal.mutate({ 
                            id: goal.id, 
                            currentAmount: String(Number(goal.currentAmount) + Number(amount)) 
                          });
                        }
                     }}
                   >
                     <Plus className="w-3 h-3 mr-1" /> Add Funds
                   </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Layout>
  );
}
