from langchain_core.tools import tool


def get_pricing_service(plan: str) -> dict:
    """Service function containing business logic for pricing"""
    pricing = {
        "starter": {
            "price": "₹99/month",
            "features": [
                "500 leads/month",
                "5 email templates",
                "Basic analytics",
                "Email support",
                "Business intelligence integration"
            ],
            "best_for": "Freelancers and small businesses"
        },
        "pro": {
            "price": "₹1,499/month",
            "features": [
                "2,000 leads/month",
                "Unlimited templates",
                "Advanced analytics",
                "Priority support",
                "AI email generation",
                "Lead scoring",
                "Custom domain email"
            ],
            "best_for": "Growing businesses",
            "popular": True
        },
        "agency": {
            "price": "₹3,999/month",
            "features": [
                "Unlimited leads",
                "Unlimited templates",
                "White-label solution",
                "API access",
                "Team accounts",
                "Dedicated support"
            ],
            "best_for": "Agencies and large teams"
        }
    }
    return pricing.get(plan.lower(), {"error": "Plan not found. Available plans: starter, pro, agency"})


def get_features_service(category: str = "all") -> dict:
    """Service function for features information"""
    features = {
        "lead_generation": {
            "name": "AI Lead Generation",
            "description": "4 powerful campaign modes: Location-based, Category-focused, Keyword search, and Custom targeting with AI analysis",
            "highlights": ["110+ business categories", "Geographic targeting", "AI lead scoring"]
        },
        "email": {
            "name": "Smart Email Generation",
            "description": "AI-powered personalized emails with batch generation and industry-specific messaging",
            "highlights": ["Personalized content", "Batch email creation", "Industry templates"]
        },
        "crm": {
            "name": "Client Management",
            "description": "Convert leads to clients seamlessly. Manage relationships and track interactions",
            "highlights": ["Lead-to-client conversion", "Relationship tracking", "Business profiles"]
        },
        "projects": {
            "name": "Project Management",
            "description": "Complete project lifecycle with task tracking, time logging, and milestone management",
            "highlights": ["Task management", "Time tracking", "Progress monitoring"]
        },
        "invoicing": {
            "name": "Professional Invoicing",
            "description": "Create professional invoices with multiple templates and tax calculations",
            "highlights": ["Multiple templates", "PDF generation", "Payment tracking"]
        },
        "support": {
            "name": "Support System",
            "description": "Built-in ticketing system with priority levels and conversation tracking",
            "highlights": ["Priority tickets", "Conversation history", "Email notifications"]
        }
    }
    
    if category == "all":
        return {"features": features}
    return features.get(category.lower(), {"error": "Category not found"})


def schedule_demo_service(name: str, email: str, preferred_time: str = "flexible") -> dict:
    """Service function for demo scheduling"""
    return {
        "status": "scheduled",
        "message": f"Demo scheduled for {name} ({email})",
        "next_steps": "Our team will contact you within 24 hours to confirm the demo time",
        "contact": "support@leadgenlite.com"
    }


def get_company_info_service() -> dict:
    """Service function for company information"""
    return {
        "name": "LeadGenLite",
        "tagline": "Complete Business Management Platform From Leads to Client Success",
        "description": "All-in-one solution for freelancers and agencies: AI lead generation, client management, project tracking, professional invoicing, and support system",
        "benefits": [
            "10x Faster Lead Generation",
            "95% Time Savings",
            "2500+ Happy Customers",
            "500K+ Leads Generated"
        ],
        "trial": "7-Day Free Trial",
        "setup_time": "2 Minutes",
        "support": {
            "email": "support@leadgenlite.com",
            "hours": "Monday-Friday 9AM-6PM EST, Saturday 10AM-4PM EST",
            "live_chat": "Available 24/7"
        },
        "operator": {
            "name": "Sunny Kumar",
            "email": "sunny.10k00@gmail.com",
            "location": "Lalganj Vaishali Bihar"
        }
    }


@tool
def get_pricing(plan: str = "all") -> dict:
    """Get pricing information for LeadGenLite plans. Available plans: starter, pro, agency, or 'all' for all plans."""
    if plan.lower() == "all":
        return {
            "starter": get_pricing_service("starter"),
            "pro": get_pricing_service("pro"),
            "agency": get_pricing_service("agency"),
            "trial": "7-day free trial available with no credit card required"
        }
    return get_pricing_service(plan)


@tool
def get_features(category: str = "all") -> dict:
    """Get information about LeadGenLite features. Categories: lead_generation, email, crm, projects, invoicing, support, or 'all' for all features."""
    return get_features_service(category)


@tool
def schedule_demo(name: str, email: str, preferred_time: str = "flexible") -> dict:
    """Schedule a demo for LeadGenLite. Requires name and email, optional preferred_time."""
    return schedule_demo_service(name, email, preferred_time)


@tool
def get_company_info() -> dict:
    """Get general information about LeadGenLite company, mission, benefits, and contact details."""
    return get_company_info_service()


TOOLS = [get_pricing, get_features, schedule_demo, get_company_info]
