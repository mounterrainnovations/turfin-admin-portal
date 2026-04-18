import { useState, useEffect, useCallback } from "react";
import * as api from "./api";
import { Role, Permission, SubAdmin } from "./types";

export function useRoles() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listRoles();
      setRoles(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  return { roles, isLoading, error, refresh: fetchRoles };
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPermissions = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listPermissions();
      setPermissions(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return { permissions, isLoading, error };
}

export function useSubAdmins() {
  const [subAdmins, setSubAdmins] = useState<SubAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSubAdmins = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.listSubAdmins();
      setSubAdmins(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSubAdmins();
  }, [fetchSubAdmins]);

  return { subAdmins, isLoading, error, refresh: fetchSubAdmins };
}
