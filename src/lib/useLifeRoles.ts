'use client';
import { useState, useEffect, useCallback } from 'react';
import { LifeRoleDef } from '@/types';
import { lifeRoleStore } from './storage';
import { buildRoleMap } from './roles';

/**
 * 현재 사용자의 역할 목록을 로드/제공하는 훅.
 * roleMap으로 id→정의 조회(orphan-safe), refresh로 변경 후 재로딩.
 */
export function useLifeRoles() {
  const [roles, setRoles] = useState<LifeRoleDef[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const data = await lifeRoleStore.getAll();
    setRoles(data);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { roles, roleMap: buildRoleMap(roles), loading, refresh };
}
