/*
 * Change password.
 * POST etk_security_pkg/change_password_dml { authorization, old_password, new_password }
 * After it succeeds the user record is re-read (me_data) so
 * must_change_pwd_flag turns N and the rest of the app opens.
 */
import React, { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { PAGES_PATH_NAMES } from "../../routes/constants";
import { Alert, Button, Form, Input, message } from "antd";
import styled from "styled-components";
import { useBasicMutation, useBasicQuery } from "../../hooks";
import { useAppConfig, CurrentUserType } from "../../store";
import { useLabels } from "../../labels";
import { ShadowSection, PageTitle } from "../../components/commons";

const Wrapper = styled.div`
  max-width: 420px;
  margin: 40px auto;
`;

const ChangePasswordPage = () => {
  const labels = useLabels();
  const { user, setUser } = useAppConfig();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  // 24-11-2026 NEW    : remembers that this save is the forced first change
  // REASON : after the flag turned N the address stayed /change-password, which is also a normal
  //          route, so the same page showed again and the user had to click the menu
  // BENEFIT: the forced change lands straight on the home page
  const forcedRef = useRef(false);

  const { runQuery: reloadMe } = useBasicQuery({
    apiId: "me",
    onResponse: ({ apiValues, error: apiError }) => {
      if (!apiError) {
        const next = (apiValues.data || [])[0] as CurrentUserType;
        if (next) {
          setUser(next); // first: the routes switch to the normal menu
          if (forcedRef.current) {
            forcedRef.current = false; // then: leave /change-password
            navigate(
              next.user_kind === "S" ? PAGES_PATH_NAMES.home : PAGES_PATH_NAMES.clientHome,
              { replace: true },
            );
          }
        }
      }
    },
  });

  const { loading, mutate } = useBasicMutation({
    apiId: "changePassword",
    flatBody: true,
  });

  const onSubmit = useCallback(
    // 23-11-2026 (antd 6): called by Form onFinish (no event); OLD: Form onSubmit(event)
    async () => {
      setError("");

      // 24-11-2026 OLD: if (newPassword.length < 8) -> "at least 8 characters"
      // NEW   : no length check here; the server checks setting PASSWORD_MIN_LENGTH (script ETKT_17)
      // REASON: the minimum became a setting (6 in the test environment)
      // BENEFIT: one rule in one place; the server message says the real number
      if (newPassword !== confirm) {
        setError(labels("passwordsDoNotMatch"));
        return;
      }

      forcedRef.current = !!user && user.must_change_pwd_flag === "Y";
      const { error: apiError } = await mutate({
        old_password: oldPassword,
        new_password: newPassword,
      });

      if (apiError) {
        setError(apiError);
        return;
      }

      message.success(labels("saved"));
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
      reloadMe();
    },
    [mutate, oldPassword, newPassword, confirm, labels, reloadMe, user],
  );

  return (
    <Wrapper>
      <ShadowSection padding="20px 22px">
        <PageTitle>{labels("changePassword")}</PageTitle>

        {user && user.must_change_pwd_flag === "Y" ? (
          <Alert
            type="warning"
            showIcon
            title={labels("mustChangePassword")}
            style={{ margin: "12px 0" }}
          />
        ) : null}

        {error ? (
          <Alert
            type="error"
            showIcon
            title={error}
            style={{ margin: "12px 0" }}
          />
        ) : null}

        <Form onFinish={onSubmit} style={{ marginTop: 14 }}>
          <Form.Item label={labels("oldPassword")}>
            <Input
              type="password"
              value={oldPassword}
              onChange={(event) => setOldPassword(event.target.value)}
            />
          </Form.Item>
          <Form.Item label={labels("newPassword")}>
            <Input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </Form.Item>
          <Form.Item label={labels("confirmPassword")}>
            <Input
              type="password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
            />
          </Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            disabled={!oldPassword || !newPassword || !confirm}
          >
            {labels("save")}
          </Button>
        </Form>
      </ShadowSection>
    </Wrapper>
  );
};

export default ChangePasswordPage;
