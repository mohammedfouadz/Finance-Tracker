--
-- PostgreSQL database dump
--

\restrict zv10ApuaCM6uh9rhsINoVpgRWF45dGahDhdQzL79m3ZVseCRvBFtNK8G95fhZyK

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: analytics; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.analytics (
    id integer NOT NULL,
    user_id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    data jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.analytics OWNER TO postgres;

--
-- Name: analytics_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.analytics_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.analytics_id_seq OWNER TO postgres;

--
-- Name: analytics_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.analytics_id_seq OWNED BY public.analytics.id;


--
-- Name: assets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.assets (
    id integer NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    location text,
    purchase_date timestamp without time zone NOT NULL,
    purchase_price numeric NOT NULL,
    current_value numeric NOT NULL,
    status text DEFAULT 'owned'::text NOT NULL,
    monthly_income numeric,
    notes text,
    image_url text,
    created_at timestamp without time zone DEFAULT now(),
    currency_code text DEFAULT 'USD'::text NOT NULL,
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE public.assets OWNER TO postgres;

--
-- Name: assets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.assets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.assets_id_seq OWNER TO postgres;

--
-- Name: assets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.assets_id_seq OWNED BY public.assets.id;


--
-- Name: balance_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.balance_history (
    id integer NOT NULL,
    bank_account_id integer NOT NULL,
    previous_balance numeric NOT NULL,
    new_balance numeric NOT NULL,
    changed_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.balance_history OWNER TO postgres;

--
-- Name: balance_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.balance_history_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.balance_history_id_seq OWNER TO postgres;

--
-- Name: balance_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.balance_history_id_seq OWNED BY public.balance_history.id;


--
-- Name: bank_accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bank_accounts (
    id integer NOT NULL,
    user_id text NOT NULL,
    bank_name text NOT NULL,
    account_type text NOT NULL,
    account_number text NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    balance numeric DEFAULT '0'::numeric NOT NULL,
    last_updated timestamp without time zone DEFAULT now(),
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL,
    is_zakatable boolean DEFAULT true
);


ALTER TABLE public.bank_accounts OWNER TO postgres;

--
-- Name: bank_accounts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bank_accounts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bank_accounts_id_seq OWNER TO postgres;

--
-- Name: bank_accounts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bank_accounts_id_seq OWNED BY public.bank_accounts.id;


--
-- Name: budgets; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.budgets (
    id integer NOT NULL,
    user_id text NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    category_id integer NOT NULL,
    amount numeric NOT NULL,
    spent numeric DEFAULT '0'::numeric
);


ALTER TABLE public.budgets OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.budgets_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.budgets_id_seq OWNER TO postgres;

--
-- Name: budgets_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.budgets_id_seq OWNED BY public.budgets.id;


--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    parent_id integer,
    allocation_percentage numeric,
    allocation_amount numeric,
    color text DEFAULT '#000000'::text NOT NULL,
    priority integer DEFAULT 0,
    is_system boolean DEFAULT false
);


ALTER TABLE public.categories OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.categories_id_seq OWNER TO postgres;

--
-- Name: categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id integer NOT NULL,
    title text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: debt_payments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.debt_payments (
    id integer NOT NULL,
    debt_id integer NOT NULL,
    amount numeric NOT NULL,
    payment_date timestamp without time zone NOT NULL,
    notes text,
    currency_code text DEFAULT 'USD'::text NOT NULL,
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE public.debt_payments OWNER TO postgres;

--
-- Name: debt_payments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.debt_payments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.debt_payments_id_seq OWNER TO postgres;

--
-- Name: debt_payments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.debt_payments_id_seq OWNED BY public.debt_payments.id;


--
-- Name: debts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.debts (
    id integer NOT NULL,
    user_id text NOT NULL,
    creditor_name text NOT NULL,
    original_amount numeric NOT NULL,
    remaining_amount numeric NOT NULL,
    currency text DEFAULT 'USD'::text NOT NULL,
    reason text NOT NULL,
    date_taken timestamp without time zone NOT NULL,
    due_date timestamp without time zone,
    interest_rate numeric,
    status text DEFAULT 'active'::text NOT NULL,
    payment_plan text,
    installment_amount numeric,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE public.debts OWNER TO postgres;

--
-- Name: debts_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.debts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.debts_id_seq OWNER TO postgres;

--
-- Name: debts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.debts_id_seq OWNED BY public.debts.id;


--
-- Name: goal_contributions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goal_contributions (
    id integer NOT NULL,
    goal_id integer NOT NULL,
    amount numeric NOT NULL,
    contribution_date timestamp without time zone NOT NULL,
    notes text,
    currency_code text DEFAULT 'USD'::text NOT NULL,
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE public.goal_contributions OWNER TO postgres;

--
-- Name: goal_contributions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goal_contributions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goal_contributions_id_seq OWNER TO postgres;

--
-- Name: goal_contributions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goal_contributions_id_seq OWNED BY public.goal_contributions.id;


--
-- Name: goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.goals (
    id integer NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    target_amount numeric NOT NULL,
    current_amount numeric DEFAULT '0'::numeric,
    deadline timestamp without time zone,
    priority integer DEFAULT 0,
    status text DEFAULT 'active'::text,
    created_at timestamp without time zone DEFAULT now(),
    currency_code text DEFAULT 'USD'::text NOT NULL,
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE public.goals OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.goals_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.goals_id_seq OWNER TO postgres;

--
-- Name: goals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.goals_id_seq OWNED BY public.goals.id;


--
-- Name: investments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.investments (
    id integer NOT NULL,
    user_id text NOT NULL,
    name text NOT NULL,
    type text NOT NULL,
    quantity numeric,
    purchase_price numeric NOT NULL,
    unit_price_at_purchase numeric,
    current_value numeric NOT NULL,
    purchase_date timestamp without time zone NOT NULL,
    platform text,
    status text DEFAULT 'active'::text NOT NULL,
    sell_date timestamp without time zone,
    sell_price numeric,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    currency_code text DEFAULT 'USD'::text NOT NULL,
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL,
    zakat_method text DEFAULT 'market_value'::text
);


ALTER TABLE public.investments OWNER TO postgres;

--
-- Name: investments_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.investments_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.investments_id_seq OWNER TO postgres;

--
-- Name: investments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.investments_id_seq OWNED BY public.investments.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    conversation_id integer NOT NULL,
    role text NOT NULL,
    content text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: transactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.transactions (
    id integer NOT NULL,
    user_id text NOT NULL,
    category_id integer,
    amount numeric NOT NULL,
    date timestamp without time zone NOT NULL,
    description text,
    is_recurring boolean DEFAULT false,
    recurrence_pattern text,
    receipt_url text,
    tags text[],
    created_at timestamp without time zone DEFAULT now(),
    currency_code text DEFAULT 'USD'::text NOT NULL,
    exchange_rate_to_usd numeric DEFAULT '1'::numeric NOT NULL
);


ALTER TABLE public.transactions OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.transactions_id_seq OWNER TO postgres;

--
-- Name: transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.transactions_id_seq OWNED BY public.transactions.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    phone character varying,
    country character varying,
    password character varying,
    currency character varying DEFAULT 'USD'::character varying,
    language character varying DEFAULT 'en'::character varying,
    theme character varying DEFAULT 'light'::character varying,
    is_admin boolean DEFAULT false,
    is_active boolean DEFAULT true
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: zakat_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zakat_settings (
    id integer NOT NULL,
    user_id text NOT NULL,
    nisab_standard text DEFAULT 'gold'::text NOT NULL,
    include_debts boolean DEFAULT true NOT NULL,
    real_estate_mode text DEFAULT 'exempt'::text NOT NULL,
    hawl_met boolean DEFAULT false NOT NULL,
    gold_price_per_gram numeric DEFAULT '60'::numeric,
    silver_price_per_gram numeric DEFAULT 0.75,
    cash_on_hand numeric DEFAULT '0'::numeric,
    gold_grams numeric DEFAULT '0'::numeric,
    gold_karat integer DEFAULT 24,
    silver_grams numeric DEFAULT '0'::numeric,
    receivables numeric DEFAULT '0'::numeric,
    rental_income_cash numeric DEFAULT '0'::numeric,
    updated_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.zakat_settings OWNER TO postgres;

--
-- Name: zakat_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.zakat_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.zakat_settings_id_seq OWNER TO postgres;

--
-- Name: zakat_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.zakat_settings_id_seq OWNED BY public.zakat_settings.id;


--
-- Name: zakat_snapshots; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.zakat_snapshots (
    id integer NOT NULL,
    user_id text NOT NULL,
    snapshot_date timestamp without time zone DEFAULT now() NOT NULL,
    nisab_standard text NOT NULL,
    gold_price_per_gram numeric,
    silver_price_per_gram numeric,
    nisab_value_usd numeric,
    cash_total numeric DEFAULT '0'::numeric,
    gold_value numeric DEFAULT '0'::numeric,
    silver_value numeric DEFAULT '0'::numeric,
    investments_total numeric DEFAULT '0'::numeric,
    receivables_total numeric DEFAULT '0'::numeric,
    real_estate_value numeric DEFAULT '0'::numeric,
    total_zakatable_assets numeric DEFAULT '0'::numeric,
    deductible_debts numeric DEFAULT '0'::numeric,
    net_zakatable numeric DEFAULT '0'::numeric,
    nisab_met boolean DEFAULT false NOT NULL,
    hawl_met boolean DEFAULT false NOT NULL,
    zakat_due numeric DEFAULT '0'::numeric,
    notes text,
    created_at timestamp without time zone DEFAULT now()
);


ALTER TABLE public.zakat_snapshots OWNER TO postgres;

--
-- Name: zakat_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.zakat_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.zakat_snapshots_id_seq OWNER TO postgres;

--
-- Name: zakat_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.zakat_snapshots_id_seq OWNED BY public.zakat_snapshots.id;


--
-- Name: analytics id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics ALTER COLUMN id SET DEFAULT nextval('public.analytics_id_seq'::regclass);


--
-- Name: assets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets ALTER COLUMN id SET DEFAULT nextval('public.assets_id_seq'::regclass);


--
-- Name: balance_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history ALTER COLUMN id SET DEFAULT nextval('public.balance_history_id_seq'::regclass);


--
-- Name: bank_accounts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts ALTER COLUMN id SET DEFAULT nextval('public.bank_accounts_id_seq'::regclass);


--
-- Name: budgets id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets ALTER COLUMN id SET DEFAULT nextval('public.budgets_id_seq'::regclass);


--
-- Name: categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: debt_payments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.debt_payments ALTER COLUMN id SET DEFAULT nextval('public.debt_payments_id_seq'::regclass);


--
-- Name: debts id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.debts ALTER COLUMN id SET DEFAULT nextval('public.debts_id_seq'::regclass);


--
-- Name: goal_contributions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_contributions ALTER COLUMN id SET DEFAULT nextval('public.goal_contributions_id_seq'::regclass);


--
-- Name: goals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals ALTER COLUMN id SET DEFAULT nextval('public.goals_id_seq'::regclass);


--
-- Name: investments id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investments ALTER COLUMN id SET DEFAULT nextval('public.investments_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: transactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions ALTER COLUMN id SET DEFAULT nextval('public.transactions_id_seq'::regclass);


--
-- Name: zakat_settings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zakat_settings ALTER COLUMN id SET DEFAULT nextval('public.zakat_settings_id_seq'::regclass);


--
-- Name: zakat_snapshots id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zakat_snapshots ALTER COLUMN id SET DEFAULT nextval('public.zakat_snapshots_id_seq'::regclass);


--
-- Data for Name: analytics; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.analytics (id, user_id, month, year, data, created_at) FROM stdin;
\.


--
-- Data for Name: assets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.assets (id, user_id, name, type, location, purchase_date, purchase_price, current_value, status, monthly_income, notes, image_url, created_at, currency_code, exchange_rate_to_usd) FROM stdin;
1	54893882	Land	Real Estate	Gaza	2026-02-22 00:00:00	70000	60000	Owned	\N	\N	\N	2026-02-22 03:10:49.2589	USD	1
2	test-mudabbir-OD2Y7f	Test Property	Real Estate	\N	2026-02-22 00:00:00	100000	120000	Owned	\N	\N	\N	2026-02-22 03:15:13.300153	USD	1
\.


--
-- Data for Name: balance_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.balance_history (id, bank_account_id, previous_balance, new_balance, changed_at) FROM stdin;
\.


--
-- Data for Name: bank_accounts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.bank_accounts (id, user_id, bank_name, account_type, account_number, currency, balance, last_updated, notes, created_at, exchange_rate_to_usd, is_zakatable) FROM stdin;
1	test-mudabbir-OD2Y7f	Test Bank	Savings	1234567890	SAR	50000	2026-02-22 03:16:08.7384	\N	2026-02-22 03:16:08.7384	1	t
2	54893882	BOP	Savings	32424234	USD	20000	2026-02-22 22:07:18.392383	\N	2026-02-22 22:07:18.392383	1	t
3	54893882	AIB	Checking	9298938	ILS	1500	2026-02-22 22:07:46.505046	\N	2026-02-22 22:07:46.505046	1	t
\.


--
-- Data for Name: budgets; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.budgets (id, user_id, month, year, category_id, amount, spent) FROM stdin;
1	54893882	2	2026	4	555	0
2	54893882	2	2026	5	555	0
3	54893882	2	2026	6	22	0
4	54893882	2	2026	7	555	0
\.


--
-- Data for Name: categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.categories (id, user_id, name, type, parent_id, allocation_percentage, allocation_amount, color, priority, is_system) FROM stdin;
1	system	Salary	income	\N	\N	\N	#22c55e	0	t
2	system	Freelance	income	\N	\N	\N	#4ade80	0	t
3	system	Investments	income	\N	\N	\N	#3b82f6	0	t
4	system	Housing	expense	\N	\N	\N	#ef4444	0	t
5	system	Food & Groceries	expense	\N	\N	\N	#f97316	0	t
6	system	Transportation	expense	\N	\N	\N	#eab308	0	t
7	system	Utilities	expense	\N	\N	\N	#84cc16	0	t
8	system	Healthcare	expense	\N	\N	\N	#06b6d4	0	t
9	system	Savings	expense	\N	\N	\N	#8b5cf6	0	t
10	system	Emergency Fund	expense	\N	\N	\N	#d946ef	0	t
11	system	Entertainment	expense	\N	\N	\N	#f43f5e	0	t
12	system	Shopping	expense	\N	\N	\N	#ec4899	0	t
13	system	Travel	expense	\N	\N	\N	#0ea5e9	0	t
14	54893882	Gold	expense	\N	\N	\N	#f59e0b	0	f
15	system	Salary	income	\N	\N	\N	#22c55e	0	t
16	system	Freelance	income	\N	\N	\N	#4ade80	0	t
17	system	Investments	income	\N	\N	\N	#3b82f6	0	t
18	system	Housing	expense	\N	\N	\N	#ef4444	0	t
19	system	Food & Groceries	expense	\N	\N	\N	#f97316	0	t
20	system	Transportation	expense	\N	\N	\N	#eab308	0	t
21	system	Utilities	expense	\N	\N	\N	#84cc16	0	t
22	system	Healthcare	expense	\N	\N	\N	#06b6d4	0	t
23	system	Savings	expense	\N	\N	\N	#8b5cf6	0	t
24	system	Emergency Fund	expense	\N	\N	\N	#d946ef	0	t
25	system	Entertainment	expense	\N	\N	\N	#f43f5e	0	t
26	system	Shopping	expense	\N	\N	\N	#ec4899	0	t
27	system	Travel	expense	\N	\N	\N	#0ea5e9	0	t
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, title, created_at) FROM stdin;
\.


--
-- Data for Name: debt_payments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.debt_payments (id, debt_id, amount, payment_date, notes, currency_code, exchange_rate_to_usd) FROM stdin;
1	2	500	2026-02-22 00:00:00	\N	USD	1
\.


--
-- Data for Name: debts; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.debts (id, user_id, creditor_name, original_amount, remaining_amount, currency, reason, date_taken, due_date, interest_rate, status, payment_plan, installment_amount, notes, created_at, exchange_rate_to_usd) FROM stdin;
1	test-mudabbir-OD2Y7f	Test Creditor	10000	8000	SAR	Test Loan	2026-02-22 00:00:00	\N	\N	active	Monthly	\N	\N	2026-02-22 03:16:49.491568	1
2	54893882	Qase 	7000	4500	SAR	CAR	2026-02-22 00:00:00	\N	\N	active	Monthly	\N	\N	2026-02-22 22:08:42.138103	1
\.


--
-- Data for Name: goal_contributions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goal_contributions (id, goal_id, amount, contribution_date, notes, currency_code, exchange_rate_to_usd) FROM stdin;
\.


--
-- Data for Name: goals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.goals (id, user_id, name, target_amount, current_amount, deadline, priority, status, created_at, currency_code, exchange_rate_to_usd) FROM stdin;
1	54893882	CAR	10000	0	2026-12-31 00:00:00	0	active	2026-02-22 03:21:13.775417	USD	1
\.


--
-- Data for Name: investments; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.investments (id, user_id, name, type, quantity, purchase_price, unit_price_at_purchase, current_value, purchase_date, platform, status, sell_date, sell_price, notes, created_at, currency_code, exchange_rate_to_usd, zakat_method) FROM stdin;
1	test-mudabbir-OD2Y7f	Gold Bar	Gold	\N	5000	\N	5500	2026-02-22 00:00:00	\N	active	\N	\N	\N	2026-02-22 03:17:20.516295	USD	1	market_value
2	54893882	BTC	Crypto	0.005	90000	90000	70000	2026-02-22 00:00:00	\N	active	\N	\N	\N	2026-02-22 22:04:01.693751	USD	1	market_value
3	54893882	Ounce	Gold	1	3300	3300	5100	2026-02-22 00:00:00	\N	active	\N	\N	\N	2026-02-22 22:04:36.728431	USD	1	market_value
4	testuser-mc1	Test Gold EUR	Gold	1	1000	\N	1200	2025-01-15 00:00:00	\N	active	\N	\N	\N	2026-02-27 13:18:53.243476	USD	1.08	market_value
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, role, content, created_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (sid, sess, expire) FROM stdin;
haf8_ZPdluTuhAOXz7WhjIPfeRkH6qJ5	{"cookie": {"path": "/", "secure": false, "expires": "2026-04-24T11:13:13.757Z", "httpOnly": true, "originalMaxAge": 604800000}, "userId": "54893882"}	2026-04-27 17:56:57
\.


--
-- Data for Name: transactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.transactions (id, user_id, category_id, amount, date, description, is_recurring, recurrence_pattern, receipt_url, tags, created_at, currency_code, exchange_rate_to_usd) FROM stdin;
1	test-user-fin-2	1	5000	2026-02-22 00:00:00	Monthly Salary	f	\N	\N	\N	2026-02-22 01:49:38.236068	USD	1
2	test-user-fin-2	5	200	2026-02-22 00:00:00	Weekly Groceries	f	\N	\N	\N	2026-02-22 01:50:27.289597	USD	1
4	54893882	1	1899.00	2026-01-01 00:00:00	WalaPlus Salary	f	\N	\N	\N	2026-02-22 01:53:17.1437	USD	1
6	54893882	2	1055.00	2026-01-01 00:00:00	NEO	f	\N	\N	\N	2026-02-22 01:54:46.753357	USD	1
8	54893882	13	1900	2026-01-21 00:00:00	Tokyo	f	\N	\N	\N	2026-02-22 01:56:04.766199	USD	1
9	54893882	13	750	2026-01-18 00:00:00	Flights to Muscat	f	\N	\N	\N	2026-02-22 01:58:39.382713	USD	1
10	54893882	13	5720	2026-01-25 00:00:00	Flights to Amsterdam	f	\N	\N	\N	2026-02-22 01:59:13.48379	USD	1
11	54893882	5	70	2026-02-19 00:00:00	Iftar at Amsterdam	f	\N	\N	\N	2026-02-22 01:59:56.475883	USD	1
12	54893882	1	1985	2026-02-01 00:00:00	WalaPlus Salary	f	\N	\N	\N	2026-02-22 02:00:50.859314	USD	1
14	54893882	4	650	2026-01-01 00:00:00	Rent	f	\N	\N	\N	2026-02-22 02:03:13.504302	USD	1
15	54893882	6	55	2026-01-21 00:00:00	Airport Taxi	f	\N	\N	\N	2026-02-22 02:04:57.796564	USD	1
16	54893882	6	200	2026-01-25 00:00:00	Airport Taxi	f	\N	\N	\N	2026-02-22 02:05:39.958914	USD	1
17	54893882	5	110	2026-02-10 00:00:00	Last Ter apel Groceries	f	\N	\N	\N	2026-02-22 02:07:36.6492	USD	1
18	54893882	6	25	2026-02-19 00:00:00	Amsterdam Uber	f	\N	\N	\N	2026-02-22 02:08:58.089896	USD	1
19	54893882	14	5100	2026-02-01 00:00:00	Gold Unce	f	\N	\N	\N	2026-02-22 02:27:08.583751	USD	1
20	54893882	9	4900	2026-02-22 00:00:00	AIB	f	\N	\N	\N	2026-02-22 02:31:13.515465	USD	1
21	54893882	1	2222	2026-02-22 00:00:00	Frreelaandf	f	\N	\N	\N	2026-02-22 22:01:27.475378	USD	1
22	54893882	8	25	2026-02-22 00:00:00	Medicine 	f	\N	\N	\N	2026-02-22 22:02:37.904992	USD	1
23	54893882	9	10000	2026-02-22 00:00:00	BOP	f	\N	\N	\N	2026-02-22 22:05:14.681512	USD	1
24	54893882	9	5000	2026-02-22 00:00:00	BOP	f	\N	\N	\N	2026-02-22 22:05:31.150392	USD	1
25	testuser-cat1	1	500	2026-02-27 00:00:00	Test Income Entry	f	\N	\N	\N	2026-02-27 23:42:11.442106	USD	1
26	54893882	1	1200	2026-02-28 00:00:00	Walapay	f	\N	\N	\N	2026-02-28 00:24:34.179304	USD	1
27	54893882	5	22	2026-02-28 00:00:00	food	f	\N	\N	\N	2026-02-28 00:25:21.041405	USD	1
28	54893882	7	444	2026-02-28 00:00:00	test	f	\N	\N	\N	2026-02-28 00:25:38.887619	USD	1
29	54893882	5	4000	2026-02-28 00:00:00	NEO	f	\N	\N	\N	2026-02-28 00:47:47.307523	USD	0.2667
30	54893882	18	1000	2026-03-07 00:00:00	Rental	f	\N	\N	\N	2026-03-07 19:02:32.859532	USD	1
31	54893882	2	2000	2026-03-07 00:00:00	Wala	f	\N	\N	\N	2026-03-07 19:02:58.270623	USD	1
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, email, first_name, last_name, profile_image_url, created_at, updated_at, phone, country, password, currency, language, theme, is_admin, is_active) FROM stdin;
test-user-finance-1	fintest@example.com	Finance	Tester	\N	2026-02-22 01:47:12.847078	2026-02-22 01:47:12.847078	\N	\N	\N	USD	en	light	f	t
test-user-fin-2	fintest2@example.com	Finance	Tester	\N	2026-02-22 01:48:59.684397	2026-02-22 01:48:59.684397	\N	\N	\N	USD	en	light	f	t
testuser-mc1	testmc@example.com	Test	User	\N	2026-02-27 13:16:18.65924	2026-02-27 13:16:18.65924	\N	\N	\N	USD	en	light	f	t
testuser-cat1	testcat@example.com	Test	User	\N	2026-02-27 23:41:30.118732	2026-02-27 23:41:30.118732	\N	\N	\N	USD	en	light	f	t
54893882	mohammedfalzaq@gmail.com	Mohammed	Fouad	\N	2026-02-16 22:58:53.788851	2026-04-17 12:37:56.359	\N	\N	$2b$10$Oah9vwMQKVWgB/8.aC0kseYeUpz9thZb4JqGqQQ0/4JPhy0jCMQGm	EUR	en	light	t	t
043d45b3-8307-4e75-ab40-a2e52de21cad	testuser_mI9VcV@example.com	TestUser	FinTrack	\N	2026-02-22 02:29:45.323783	2026-02-22 02:30:27.825	+15551234567	United States	$2b$10$2RPkSTeA4qCpGlB3ugXWJ.0ifiNk5kIswC9ic6YsNXd6IdzaVVywa	USD	en	light	f	t
test-mudabbir-OD2Y7f	testuser-yIczc@example.com	Test	User	\N	2026-02-22 03:14:08.374809	2026-02-22 03:14:08.374809	\N	\N	\N	USD	en	light	f	t
\.


--
-- Data for Name: zakat_settings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zakat_settings (id, user_id, nisab_standard, include_debts, real_estate_mode, hawl_met, gold_price_per_gram, silver_price_per_gram, cash_on_hand, gold_grams, gold_karat, silver_grams, receivables, rental_income_cash, updated_at) FROM stdin;
\.


--
-- Data for Name: zakat_snapshots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.zakat_snapshots (id, user_id, snapshot_date, nisab_standard, gold_price_per_gram, silver_price_per_gram, nisab_value_usd, cash_total, gold_value, silver_value, investments_total, receivables_total, real_estate_value, total_zakatable_assets, deductible_debts, net_zakatable, nisab_met, hawl_met, zakat_due, notes, created_at) FROM stdin;
\.


--
-- Name: analytics_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.analytics_id_seq', 1, false);


--
-- Name: assets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.assets_id_seq', 2, true);


--
-- Name: balance_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.balance_history_id_seq', 1, false);


--
-- Name: bank_accounts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.bank_accounts_id_seq', 3, true);


--
-- Name: budgets_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.budgets_id_seq', 4, true);


--
-- Name: categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.categories_id_seq', 27, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 1, false);


--
-- Name: debt_payments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.debt_payments_id_seq', 1, true);


--
-- Name: debts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.debts_id_seq', 2, true);


--
-- Name: goal_contributions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goal_contributions_id_seq', 1, false);


--
-- Name: goals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.goals_id_seq', 1, true);


--
-- Name: investments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.investments_id_seq', 4, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.transactions_id_seq', 31, true);


--
-- Name: zakat_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.zakat_settings_id_seq', 1, false);


--
-- Name: zakat_snapshots_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.zakat_snapshots_id_seq', 1, false);


--
-- Name: analytics analytics_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.analytics
    ADD CONSTRAINT analytics_pkey PRIMARY KEY (id);


--
-- Name: assets assets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.assets
    ADD CONSTRAINT assets_pkey PRIMARY KEY (id);


--
-- Name: balance_history balance_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_pkey PRIMARY KEY (id);


--
-- Name: bank_accounts bank_accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bank_accounts
    ADD CONSTRAINT bank_accounts_pkey PRIMARY KEY (id);


--
-- Name: budgets budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_pkey PRIMARY KEY (id);


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.categories
    ADD CONSTRAINT categories_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: debt_payments debt_payments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_pkey PRIMARY KEY (id);


--
-- Name: debts debts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.debts
    ADD CONSTRAINT debts_pkey PRIMARY KEY (id);


--
-- Name: goal_contributions goal_contributions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_contributions
    ADD CONSTRAINT goal_contributions_pkey PRIMARY KEY (id);


--
-- Name: goals goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goals
    ADD CONSTRAINT goals_pkey PRIMARY KEY (id);


--
-- Name: investments investments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.investments
    ADD CONSTRAINT investments_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: transactions transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: zakat_settings zakat_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zakat_settings
    ADD CONSTRAINT zakat_settings_pkey PRIMARY KEY (id);


--
-- Name: zakat_settings zakat_settings_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zakat_settings
    ADD CONSTRAINT zakat_settings_user_id_unique UNIQUE (user_id);


--
-- Name: zakat_snapshots zakat_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.zakat_snapshots
    ADD CONSTRAINT zakat_snapshots_pkey PRIMARY KEY (id);


--
-- Name: IDX_session_expire; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_session_expire" ON public.sessions USING btree (expire);


--
-- Name: balance_history balance_history_bank_account_id_bank_accounts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.balance_history
    ADD CONSTRAINT balance_history_bank_account_id_bank_accounts_id_fk FOREIGN KEY (bank_account_id) REFERENCES public.bank_accounts(id);


--
-- Name: budgets budgets_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.budgets
    ADD CONSTRAINT budgets_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- Name: debt_payments debt_payments_debt_id_debts_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.debt_payments
    ADD CONSTRAINT debt_payments_debt_id_debts_id_fk FOREIGN KEY (debt_id) REFERENCES public.debts(id);


--
-- Name: goal_contributions goal_contributions_goal_id_goals_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.goal_contributions
    ADD CONSTRAINT goal_contributions_goal_id_goals_id_fk FOREIGN KEY (goal_id) REFERENCES public.goals(id);


--
-- Name: messages messages_conversation_id_conversations_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_conversations_id_fk FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: transactions transactions_category_id_categories_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_category_id_categories_id_fk FOREIGN KEY (category_id) REFERENCES public.categories(id);


--
-- PostgreSQL database dump complete
--

\unrestrict zv10ApuaCM6uh9rhsINoVpgRWF45dGahDhdQzL79m3ZVseCRvBFtNK8G95fhZyK

