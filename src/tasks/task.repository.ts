import { Repository, EntityRepository, SelectQueryBuilder } from 'typeorm';
import { Task } from './task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { TaskStatus } from './task-status.enum';
import { GetTasksFilterDto } from './dto/get-tasks-filter.dto';
import { User } from '../auth/user.entity';
import { userInfo } from 'os';

@EntityRepository(Task)
export class TaskRepository extends Repository<Task> {
  async getTasks(filterDto: GetTasksFilterDto, user: User): Promise<Task[]> {
    const query = this.createQueryBuilder('task');
    query.where('task.userId = :userId', { userId: user.id });
    let allTasks = Object.keys(filterDto).length > 0
      ? await this.getQueryWithFilters(filterDto, query).getMany()
      : await query.getMany();
    return allTasks;
  }

  private getQueryWithFilters(
    filterDto: GetTasksFilterDto,
    query: SelectQueryBuilder<Task>,
  ): SelectQueryBuilder<Task> {
    const { status, search } = filterDto;
    if (status) {
      query.andWhere('task.status = :status', { status });
    }
    if (search) {
      query.andWhere(
        '(task.title LIKE :search OR task.description LIKE :search)',
        { search: `%${search}%` },
      );
    }
    return query;
  }

  async createTask(createTaskDto: CreateTaskDto, user: User): Promise<Task> {
    const { title, description } = createTaskDto;
    const task = new Task(title, description, TaskStatus.OPEN, user, user.id);
    await task.save();
    delete task.user;
    return task;
  }
}
