import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateUserDto } from './update-user.dto';

describe('UpdateUserDto', () => {
  it('accepts a payload that omits name', async () => {
    const dto = plainToInstance(UpdateUserDto, { title: 'Analyst' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('accepts a well-formed name', async () => {
    const dto = plainToInstance(UpdateUserDto, { name: 'Jane Doe' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects an explicit empty-string name', async () => {
    const dto = plainToInstance(UpdateUserDto, { name: '' });
    const errors = await validate(dto);
    const nameError = errors.find(e => e.property === 'name');
    expect(nameError).toBeDefined();
    expect(nameError?.constraints).toHaveProperty('isNotEmpty');
  });
});
