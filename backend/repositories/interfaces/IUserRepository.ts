import { IBaseRepository } from './IBaseRepository';
import { IUser } from '../../models/User';

export interface IUserRepository extends IBaseRepository<IUser> {
}
